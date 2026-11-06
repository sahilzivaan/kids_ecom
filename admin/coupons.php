<?php
require_once 'includes/auth.php';
require_once 'includes/db.php';

// Active Coupons
$stmt = $pdo->query("SELECT COUNT(*) FROM coupons WHERE status='Active'");
$activeCoupons = $stmt->fetchColumn() ?: 0;

// Total Redemptions
$stmt = $pdo->query("SELECT SUM(usage_count) FROM coupons");
$totalRedemptions = $stmt->fetchColumn() ?: 0;

// Expiring Soon (within 7 days)
$stmt = $pdo->query("SELECT COUNT(*) FROM coupons WHERE status='Active' AND expiry BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)");
$expiringSoon = $stmt->fetchColumn() ?: 0;

// Fetch coupons
$stmt = $pdo->query("SELECT id, code, description, type, value, min_order, max_uses, usage_count, expiry, status, created_at FROM coupons ORDER BY created_at DESC");
$coupons = $stmt->fetchAll(PDO::FETCH_ASSOC);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Coupons & Discounts - Chhotu Fashion</title>
    <link rel="stylesheet" href="assets/admin.css">
    <style>
        .kpi-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
        .text-danger { color: #dc3545; }
        .text-warning { color: #ffc107; }
        .form-row { display: flex; gap: 1rem; }
        .form-row > * { flex: 1; }
        .input-group { display: flex; }
        .input-group .form-control { border-top-right-radius: 0; border-bottom-right-radius: 0; }
        .input-group .btn { border-top-left-radius: 0; border-bottom-left-radius: 0; border: 1px solid var(--border); border-left: 0; }
    </style>
</head>
<body>
<div class="admin-wrapper">
    <?php include 'includes/sidebar.php'; ?>
    <div class="admin-main" id="adminMain">
        <?php include 'includes/topbar.php'; ?>
        <main class="admin-content">
            
            <div class="sec-hdr">
                <div>
                    <div class="sec-title">Coupons & Discounts</div>
                    <div class="sec-sub">Manage promo codes and discounts for customers</div>
                </div>
                <button class="btn btn-gold" onclick="openCouponModal()">➕ Add Coupon</button>
            </div>

            <div class="kpi-row">
                <div class="kpi-card">
                    <div class="kpi-top">
                        <div class="kpi-icon">🎫</div>
                    </div>
                    <div class="kpi-value"><?= number_format($activeCoupons) ?></div>
                    <div class="kpi-label">Active Coupons</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-top">
                        <div class="kpi-icon">🎁</div>
                    </div>
                    <div class="kpi-value"><?= number_format($totalRedemptions) ?></div>
                    <div class="kpi-label">Total Redemptions</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-top">
                        <div class="kpi-icon">⏳</div>
                    </div>
                    <div class="kpi-value"><?= number_format($expiringSoon) ?></div>
                    <div class="kpi-label">Expiring Soon</div>
                </div>
            </div>

            <div class="admin-card">
                <div class="card-header">
                    <div class="card-header-left">
                        <div class="card-title-icon">🏷️</div>
                        <span class="card-title">All Coupons</span>
                        <span class="card-count"><?= count($coupons) ?></span>
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <select id="couponStatusFilter" class="form-control" style="width:150px;">
                            <option value="">All Status</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                        <input type="text" id="couponSearch" class="form-control" placeholder="Search code/desc..." style="width:200px;">
                    </div>
                </div>
                <div class="card-body p-0">
                    <div class="tbl-wrapper">
                        <table class="admin-table" id="couponsTable">
                            <thead>
                                <tr>
                                    <th>Code</th>
                                    <th>Description</th>
                                    <th>Discount</th>
                                    <th>Min Order</th>
                                    <th>Uses</th>
                                    <th>Expiry</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <!-- Rendered by JS -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

        </main>
    </div>
</div>

<!-- Add/Edit Coupon Modal -->
<div class="modal-overlay" id="couponModal">
    <div class="modal-container modal-lg">
        <div class="modal-header">
            <h3 id="couponModalTitle">Add Coupon</h3>
            <button class="modal-close" onclick="closeModal('couponModal')">✕</button>
        </div>
        <div class="modal-body">
            <form id="couponForm">
                <input type="hidden" id="couponId">
                <div class="form-group">
                    <label class="form-label">Coupon Code <span class="text-danger">*</span></label>
                    <div class="input-group">
                        <input type="text" id="couponCode" class="form-control" required style="text-transform: uppercase;">
                        <button type="button" class="btn btn-outline" onclick="generateCode()">Generate</button>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Description</label>
                    <input type="text" id="couponDesc" class="form-control" placeholder="e.g. 10% off for new users">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Type <span class="text-danger">*</span></label>
                        <select id="couponType" class="form-control" required>
                            <option value="percent">Percentage (%)</option>
                            <option value="flat">Flat Amount (₹)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Value <span class="text-danger">*</span></label>
                        <input type="number" id="couponValue" class="form-control" step="0.01" min="0" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Min Order Amount (₹)</label>
                        <input type="number" id="couponMinOrder" class="form-control" step="0.01" min="0" value="0">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Max Uses (Leave empty for unlimited)</label>
                        <input type="number" id="couponMaxUses" class="form-control" min="1">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Expiry Date & Time</label>
                        <input type="datetime-local" id="couponExpiry" class="form-control">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Status</label>
                        <select id="couponStatus" class="form-control">
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>
                </div>
            </form>
        </div>
        <div class="modal-footer">
            <button class="btn btn-outline" onclick="closeModal('couponModal')">Cancel</button>
            <button class="btn btn-gold" onclick="saveCoupon()">Save Coupon</button>
        </div>
    </div>
</div>

<script src="assets/admin.js"></script>
<script>
const couponsData = <?= json_encode($coupons) ?>;

function getStatusBadge(status) {
    switch(status) {
        case 'Active': return '<span class="badge b-success">Active</span>';
        case 'Inactive': return '<span class="badge b-danger">Inactive</span>';
        default: return '<span class="badge b-muted">' + status + '</span>';
    }
}

const couponsTable = new AdminTable('coupons', {
    data: couponsData,
    perPage: 15,
    searchFields: ['code', 'description'],
    filterField: 'status',
    renderRow(row) {
        const discountStr = row.type === 'percent' ? `${parseFloat(row.value)}%` : `₹${parseFloat(row.value)}`;
        const usesStr = row.max_uses ? `${row.usage_count} / ${row.max_uses}` : `${row.usage_count} / ∞`;
        
        let expiryHtml = '-';
        if (row.expiry) {
            const expiryDate = new Date(row.expiry);
            const now = new Date();
            const diffTime = expiryDate - now;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            let colorClass = '';
            if (diffTime < 0) {
                colorClass = 'text-danger'; // Expired
            } else if (diffDays <= 7) {
                colorClass = 'text-warning'; // Expiring soon
            }
            
            // Format expiry to readable string
            expiryHtml = `<span class="${colorClass}">${expiryDate.toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}</span>`;
        }

        return `
            <tr>
                <td><strong>${row.code}</strong></td>
                <td>${row.description || '-'}</td>
                <td><span class="badge ${row.type === 'percent' ? 'b-info' : 'b-gold'}">${discountStr}</span></td>
                <td>₹${parseFloat(row.min_order)}</td>
                <td>${usesStr}</td>
                <td>${expiryHtml}</td>
                <td>${getStatusBadge(row.status)}</td>
                <td>
                    <div style="display:flex;gap:0.5rem;">
                        <button class="btn btn-sm btn-outline" title="Edit" onclick='editCoupon(${JSON.stringify(row).replace(/'/g, "&apos;")})'>✏️</button>
                        <button class="btn btn-sm btn-outline" title="Toggle Status" onclick="toggleStatus(${row.id})">🔄</button>
                        <button class="btn btn-sm btn-outline" style="color:var(--danger)" title="Delete" onclick="deleteCoupon(${row.id})">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    }
});

// Link search and filter
document.getElementById('couponSearch').addEventListener('input', e => couponsTable.setSearch(e.target.value));
document.getElementById('couponStatusFilter').addEventListener('change', e => couponsTable.setFilter(e.target.value));

function generateCode() {
    document.getElementById('couponCode').value = Math.random().toString(36).substr(2,8).toUpperCase();
}

function openCouponModal() {
    document.getElementById('couponForm').reset();
    document.getElementById('couponId').value = '';
    document.getElementById('couponModalTitle').innerText = 'Add Coupon';
    openModal('couponModal');
}

function editCoupon(row) {
    document.getElementById('couponForm').reset();
    document.getElementById('couponId').value = row.id;
    document.getElementById('couponCode').value = row.code;
    document.getElementById('couponDesc').value = row.description || '';
    document.getElementById('couponType').value = row.type;
    document.getElementById('couponValue').value = row.value;
    document.getElementById('couponMinOrder').value = row.min_order;
    document.getElementById('couponMaxUses').value = row.max_uses || '';
    
    if (row.expiry) {
        // datetime-local input expects YYYY-MM-DDTHH:MM
        const parts = row.expiry.split(' ');
        if(parts.length === 2) {
            document.getElementById('couponExpiry').value = parts[0] + 'T' + parts[1].substring(0, 5);
        } else {
            document.getElementById('couponExpiry').value = row.expiry.substring(0, 16);
        }
    } else {
        document.getElementById('couponExpiry').value = '';
    }
    
    document.getElementById('couponStatus').value = row.status;
    
    document.getElementById('couponModalTitle').innerText = 'Edit Coupon';
    openModal('couponModal');
}

async function saveCoupon() {
    const id = document.getElementById('couponId').value;
    const code = document.getElementById('couponCode').value.trim().toUpperCase();
    if (!code) return showToast('Please enter a coupon code', 'error');
    
    const value = document.getElementById('couponValue').value;
    if (!value || value < 0) return showToast('Please enter a valid discount value', 'error');

    const data = {
        action: id ? 'update' : 'create',
        id: id,
        code: code,
        description: document.getElementById('couponDesc').value,
        type: document.getElementById('couponType').value,
        value: value,
        min_order: document.getElementById('couponMinOrder').value || 0,
        max_uses: document.getElementById('couponMaxUses').value,
        expiry: document.getElementById('couponExpiry').value,
        status: document.getElementById('couponStatus').value
    };

    try {
        const res = await fetch('api/coupon_api.php', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        const result = await res.json();
        
        if (result.success) {
            showToast(result.message, 'success');
            setTimeout(() => location.reload(), 1000);
        } else {
            showToast(result.message || 'Failed to save coupon', 'error');
        }
    } catch (e) {
        showToast('Network error', 'error');
    }
}

async function toggleStatus(id) {
    try {
        const res = await fetch('api/coupon_api.php', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ action: 'toggle_status', id })
        });
        const result = await res.json();
        if (result.success) {
            showToast(result.message, 'success');
            setTimeout(() => location.reload(), 1000);
        } else {
            showToast(result.message || 'Error', 'error');
        }
    } catch (e) {
        showToast('Network error', 'error');
    }
}

async function deleteCoupon(id) {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    
    try {
        const res = await fetch('api/coupon_api.php', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ action: 'delete', id })
        });
        const result = await res.json();
        if (result.success) {
            showToast(result.message, 'success');
            setTimeout(() => location.reload(), 1000);
        } else {
            showToast(result.message || 'Error', 'error');
        }
    } catch (e) {
        showToast('Network error', 'error');
    }
}
</script>
</body>
</html>
