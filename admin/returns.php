<?php
session_start();
require_once 'includes/auth.php';
require_once 'includes/db.php';

$pageTitle = 'Returns & Refunds';
$activePage = 'returns';

// Fetch stats

$stats = $pdo->query("
    SELECT 
        COUNT(*) as total_returns,
        SUM(CASE WHEN status='Pending' THEN 1 ELSE 0 END) as pending_review,
        SUM(CASE WHEN status='Approved' THEN refund_amount ELSE 0 END) as total_refunded
    FROM returns
")->fetch(PDO::FETCH_ASSOC);

$total_returns = $stats['total_returns'] ?? 0;
$pending_review = $stats['pending_review'] ?? 0;
$total_refunded = $stats['total_refunded'] ?? 0;

// Fetch returns list
$stmt = $pdo->query("
    SELECT r.*, o.delivery_name, o.total_amount, o.payment_method 
    FROM returns r 
    LEFT JOIN orders o ON r.order_id = o.id 
    ORDER BY r.created_at DESC
");
$returns = $stmt->fetchAll(PDO::FETCH_ASSOC);

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Returns & Refunds - Chhotu Fashion</title>
    <link rel="stylesheet" href="assets/admin.css">
    <script src="assets/admin.js" defer></script>
</head>
<body>
<div class="admin-wrapper">
    <?php include 'includes/sidebar.php'; ?>
    <div class="admin-main" id="adminMain">
        <?php include 'includes/topbar.php'; ?>
        <main class="admin-content">
            
            <div class="sec-hdr">
                <div>
                    <div class="sec-title">Returns & Refunds</div>
                    <div class="sec-sub">Manage customer returns and process refunds</div>
                </div>
                <button class="btn btn-gold" onclick="openLogReturnModal()">+ Log New Return</button>
            </div>

            <div class="kpi-cards" style="display:grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 24px;">
                <div class="kpi-card">
                    <div class="kpi-top">
                        <div class="kpi-icon">📦</div>
                    </div>
                    <div class="kpi-value"><?= $total_returns ?></div>
                    <div class="kpi-label">Total Returns</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-top">
                        <div class="kpi-icon">⏳</div>
                    </div>
                    <div class="kpi-value"><?= $pending_review ?></div>
                    <div class="kpi-label">Pending Review</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-top">
                        <div class="kpi-icon">💸</div>
                    </div>
                    <div class="kpi-value">₹<?= number_format($total_refunded, 2) ?></div>
                    <div class="kpi-label">Total Refunded (Approved)</div>
                </div>
            </div>

            <div class="admin-card">
                <div class="card-header">
                    <div class="card-header-left">
                        <div class="card-title-icon">🔄</div>
                        <span class="card-title">Return Requests</span>
                        <span class="card-count"><?= count($returns) ?></span>
                    </div>
                    <div style="display:flex; gap:10px;">
                        <input type="text" id="returnSearch" class="form-control" placeholder="Search returns..." style="width:200px;">
                        <select id="statusFilter" class="form-control">
                            <option value="">All Statuses</option>
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                            <option value="Refunded">Refunded</option>
                        </select>
                    </div>
                </div>
                <div class="card-body p-0">
                    <div class="tbl-wrapper">
                        <table class="admin-table">
                            <thead>
                                <tr>
                                    <th>Return ID</th>
                                    <th>Order #</th>
                                    <th>Customer</th>
                                    <th>Reason</th>
                                    <th>Refund Amount</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="returnsTbody">
                                <!-- JS rendered -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

        </main>
    </div>
</div>

<!-- Log New Return Modal -->
<div class="modal-overlay" id="logReturnModal">
    <div class="modal-container">
        <div class="modal-header">
            <h3>Log New Return</h3>
            <button class="modal-close" onclick="closeModal('logReturnModal')">✕</button>
        </div>
        <div class="modal-body">
            <form id="logReturnForm">
                <div class="form-group">
                    <label class="form-label">Order Number *</label>
                    <input type="text" id="lr_order_number" class="form-control" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Customer Name *</label>
                    <input type="text" id="lr_customer_name" class="form-control" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Reason *</label>
                    <select id="lr_reason" class="form-control" required>
                        <option value="">Select Reason</option>
                        <option value="Defective">Defective</option>
                        <option value="Wrong Item">Wrong Item</option>
                        <option value="Size Issue">Size Issue</option>
                        <option value="Not as Described">Not as Described</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Description</label>
                    <textarea id="lr_description" class="form-control" rows="3"></textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">Refund Amount</label>
                    <input type="number" step="0.01" id="lr_refund_amount" class="form-control">
                </div>
            </form>
        </div>
        <div class="modal-footer">
            <button class="btn btn-outline" onclick="closeModal('logReturnModal')">Cancel</button>
            <button class="btn btn-gold" onclick="submitNewReturn()">Log Return</button>
        </div>
    </div>
</div>

<!-- View/Action Return Modal -->
<div class="modal-overlay" id="viewReturnModal">
    <div class="modal-container modal-lg">
        <div class="modal-header">
            <h3>Return Details <span id="vr_id_display" class="badge b-muted"></span></h3>
            <button class="modal-close" onclick="closeModal('viewReturnModal')">✕</button>
        </div>
        <div class="modal-body">
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; margin-bottom: 20px;">
                <div>
                    <h4>Order Info</h4>
                    <p><strong>Order #:</strong> <span id="vr_order_number"></span></p>
                    <p><strong>Customer:</strong> <span id="vr_customer"></span></p>
                    <p><strong>Order Total:</strong> <span id="vr_total"></span></p>
                    <p><strong>Payment Method:</strong> <span id="vr_payment"></span></p>
                </div>
                <div>
                    <h4>Return Info</h4>
                    <p><strong>Date:</strong> <span id="vr_date"></span></p>
                    <p><strong>Reason:</strong> <span id="vr_reason"></span></p>
                    <p><strong>Description:</strong> <span id="vr_description"></span></p>
                    <p><strong>Status:</strong> <span id="vr_status_badge"></span></p>
                </div>
            </div>
            
            <hr style="border:0; border-top:1px solid #eee; margin:15px 0;">

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
                <div class="form-group">
                    <label class="form-label">Refund Amount</label>
                    <input type="number" step="0.01" id="vr_refund_amount" class="form-control">
                </div>
                <div class="form-group">
                    <label class="form-label">Refund Method</label>
                    <select id="vr_refund_method" class="form-control">
                        <option value="">Select Method</option>
                        <option value="UPI">UPI</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="COD Reversal">COD Reversal</option>
                        <option value="Store Credit">Store Credit</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Admin Note</label>
                <textarea id="vr_admin_note" class="form-control" rows="3"></textarea>
            </div>
            <input type="hidden" id="vr_id">
        </div>
        <div class="modal-footer">
            <button class="btn btn-danger" onclick="updateReturnStatus('Rejected')">✖ Reject</button>
            <button class="btn btn-success" onclick="updateReturnStatus('Approved')">✅ Approve</button>
            <button class="btn btn-info" onclick="updateReturnStatus('Refunded')">Mark Refunded</button>
        </div>
    </div>
</div>

<script>
const returnsData = <?= json_encode($returns) ?>;

function getStatusBadge(status) {
    let bClass = 'b-muted';
    if(status === 'Pending') bClass = 'b-warning';
    if(status === 'Approved') bClass = 'b-success';
    if(status === 'Rejected') bClass = 'b-danger';
    if(status === 'Refunded') bClass = 'b-info';
    return `<span class="badge ${bClass}">${status}</span>`;
}

let table;
document.addEventListener('DOMContentLoaded', () => {
    table = new AdminTable('returnsTbody', {
        data: returnsData,
        perPage: 20,
        searchFields: ['order_number', 'customer_name', 'reason'],
        filterField: 'status',
        renderRow: (r) => {
            return `
                <tr>
                    <td>#R-${String(r.id).padStart(4, '0')}</td>
                    <td>${r.order_number || '-'}</td>
                    <td>${r.customer_name || '-'}</td>
                    <td>${r.reason || '-'}</td>
                    <td>₹${parseFloat(r.refund_amount || 0).toFixed(2)}</td>
                    <td>${getStatusBadge(r.status)}</td>
                    <td>${new Date(r.created_at).toLocaleDateString()}</td>
                    <td>
                        <button class="btn btn-sm btn-ghost" onclick="viewReturn(${r.id})" title="View">👁</button>
                    </td>
                </tr>
            `;
        }
    });

    document.getElementById('returnSearch').addEventListener('input', (e) => {
        table.setSearch(e.target.value);
    });

    document.getElementById('statusFilter').addEventListener('change', (e) => {
        table.setFilter(e.target.value);
    });
});

function openLogReturnModal() {
    document.getElementById('logReturnForm').reset();
    openModal('logReturnModal');
}

async function submitNewReturn() {
    const data = {
        order_number: document.getElementById('lr_order_number').value,
        customer_name: document.getElementById('lr_customer_name').value,
        reason: document.getElementById('lr_reason').value,
        description: document.getElementById('lr_description').value,
        refund_amount: document.getElementById('lr_refund_amount').value
    };

    if(!data.order_number || !data.customer_name || !data.reason) {
        showToast('Please fill required fields', 'error');
        return;
    }

    try {
        const res = await fetch('api/return_api.php?action=create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        if(result.success) {
            showToast(result.message, 'success');
            setTimeout(() => window.location.reload(), 1000);
        } else {
            showToast(result.message, 'error');
        }
    } catch(e) {
        showToast('Network error', 'error');
    }
}

function viewReturn(id) {
    const r = returnsData.find(x => x.id == id);
    if(!r) return;

    document.getElementById('vr_id').value = r.id;
    document.getElementById('vr_id_display').innerText = `#R-${String(r.id).padStart(4, '0')}`;
    
    document.getElementById('vr_order_number').innerText = r.order_number || '-';
    document.getElementById('vr_customer').innerText = r.customer_name || '-';
    document.getElementById('vr_total').innerText = r.total_amount || '-';
    document.getElementById('vr_payment').innerText = r.payment_method || '-';
    
    document.getElementById('vr_date').innerText = new Date(r.created_at).toLocaleString();
    document.getElementById('vr_reason').innerText = r.reason || '-';
    document.getElementById('vr_description').innerText = r.description || '-';
    document.getElementById('vr_status_badge').innerHTML = getStatusBadge(r.status);
    
    document.getElementById('vr_refund_amount').value = r.refund_amount || 0;
    document.getElementById('vr_refund_method').value = r.refund_method || '';
    document.getElementById('vr_admin_note').value = r.admin_note || '';

    openModal('viewReturnModal');
}

async function updateReturnStatus(status) {
    const data = {
        id: document.getElementById('vr_id').value,
        status: status,
        refund_amount: document.getElementById('vr_refund_amount').value,
        refund_method: document.getElementById('vr_refund_method').value,
        admin_note: document.getElementById('vr_admin_note').value
    };

    try {
        const res = await fetch('api/return_api.php?action=update_status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        if(result.success) {
            showToast(result.message, 'success');
            setTimeout(() => window.location.reload(), 1000);
        } else {
            showToast(result.message, 'error');
        }
    } catch(e) {
        showToast('Network error', 'error');
    }
}
</script>
</body>
</html>
