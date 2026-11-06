<?php
require_once 'includes/auth.php';
require_once 'includes/db.php';

// Fetch KPIs
$kpi_rev = $pdo->query("SELECT SUM(CAST(REPLACE(REPLACE(total_amount, '₹', ''), ',', '') AS DECIMAL(12,2))) as rev FROM orders WHERE status != 'Cancelled'")->fetchColumn() ?: 0;
$kpi_orders_today = $pdo->query("SELECT COUNT(*) FROM orders WHERE DATE(created_at) = CURDATE()")->fetchColumn();
$kpi_active_customers = $pdo->query("SELECT COUNT(*) FROM users WHERE active=1 AND id != 1")->fetchColumn();
$kpi_pending_shipments = $pdo->query("SELECT COUNT(*) FROM orders WHERE status IN ('Pending','Processing')")->fetchColumn();

// Fetch Alerts
$alert_low_stock = $pdo->query("SELECT COUNT(*) FROM products WHERE stock <= 5 AND status='Active'")->fetchColumn();
$alert_pending_old = $pdo->query("SELECT COUNT(*) FROM orders WHERE status='Pending' AND created_at < DATE_SUB(NOW(), INTERVAL 48 HOUR)")->fetchColumn();
$alert_expiring_coupons = $pdo->query("SELECT COUNT(*) FROM coupons WHERE status='Active' AND expiry BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)")->fetchColumn();
$alert_cancelled_today = $pdo->query("SELECT COUNT(*) FROM orders WHERE status='Cancelled' AND DATE(created_at) = CURDATE()")->fetchColumn();

// Recent Orders
$recent_orders = $pdo->query("SELECT o.order_number as id, o.delivery_name as customer, o.items_count as items, o.total_amount as amount, o.status, DATE_FORMAT(o.created_at, '%d %b %Y') as date FROM orders o ORDER BY o.created_at DESC LIMIT 15")->fetchAll(PDO::FETCH_ASSOC);

// Top Products (by proxy: highest discount/stock)
$top_products = $pdo->query("SELECT p.name, p.category, p.stock, p.mrp, p.sale, p.mrp - p.sale as discount FROM products p WHERE p.status='Active' ORDER BY (p.mrp - p.sale) DESC LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);

// Chart Data (Revenue last 12 months)
$chart_res = $pdo->query("SELECT DATE_FORMAT(created_at, '%b') as month, SUM(CAST(REPLACE(REPLACE(total_amount, '₹', ''), ',', '') AS DECIMAL(12,2))) as rev FROM orders WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH) AND status != 'Cancelled' GROUP BY MONTH(created_at), YEAR(created_at) ORDER BY YEAR(created_at), MONTH(created_at)")->fetchAll(PDO::FETCH_ASSOC);
$rev_map = [];
foreach ($chart_res as $row) {
    $rev_map[$row['month']] = (float)$row['rev'];
}
$chart_labels = [];
$chart_data = [];
for ($i = 11; $i >= 0; $i--) {
    $m = date('b', strtotime("-$i months"));
    $chart_labels[] = $m;
    $chart_data[] = $rev_map[$m] ?? 0;
}

// Donut Data
$status_res = $pdo->query("SELECT status, COUNT(*) as cnt FROM orders GROUP BY status")->fetchAll(PDO::FETCH_ASSOC);
$status_labels = [];
$status_data = [];
foreach ($status_res as $row) {
    $status_labels[] = $row['status'];
    $status_data[] = (int)$row['cnt'];
}
$status_colors = [
    'Pending' => '#f59e0b',
    'Processing' => '#d97706',
    'Shipped' => '#3b82f6',
    'Delivered' => '#10b981',
    'Cancelled' => '#ef4444'
];
$status_bg = [];
foreach ($status_labels as $lbl) {
    $status_bg[] = $status_colors[$lbl] ?? '#6b7280';
}

function getBadgeClass($status) {
    switch($status) {
        case 'Delivered': return 'b-success';
        case 'Active': return 'b-success';
        case 'Shipped': return 'b-info';
        case 'Processing': return 'b-gold';
        case 'Pending': return 'b-warning';
        case 'Cancelled': return 'b-danger';
        case 'Inactive': return 'b-danger';
        default: return 'b-muted';
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - Chhotu Fashion Admin</title>
    <link rel="stylesheet" href="assets/admin.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        .alerts-row { display: flex; gap: 10px; margin-bottom: 15px; flex-wrap: wrap; }
        .alert-pill { padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 500; display: inline-flex; align-items: center; gap: 6px; }
        .alert-danger { background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }
        .alert-warning { background: #fef3c7; color: #d97706; border: 1px solid #fcd34d; }
        .quick-actions-row { display: flex; gap: 10px; margin-bottom: 25px; flex-wrap: wrap; }
        
        .kpis-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-bottom: 25px; }
        .kpi-card { background: #fff; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; }
        .kpi-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        .kpi-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; background: #f8fafc; }
        .kpi-change { font-size: 12px; font-weight: 600; padding: 4px 8px; border-radius: 6px; }
        .kpi-change.up { background: #dcfce7; color: #166534; }
        .kpi-change.down { background: #fee2e2; color: #b91c1c; }
        .kpi-value { font-size: 28px; font-weight: 700; color: #0f172a; margin-bottom: 5px; }
        .kpi-label { color: #64748b; font-size: 14px; font-weight: 500; }
        
        .charts-row { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-bottom: 25px; }
        .dashboard-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-bottom: 25px; }
        
        .chart-container { position: relative; height: 300px; width: 100%; }
        
        @media (max-width: 1024px) {
            .charts-row, .dashboard-grid { grid-template-columns: 1fr; }
        }
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
                    <div class="sec-title">Dashboard Overview</div>
                    <div class="sec-sub">Welcome back! Here's what's happening today.</div>
                </div>
            </div>

            <!-- Dashboard Alert Widget -->
            <?php if($alert_low_stock > 0 || $alert_pending_old > 0 || $alert_expiring_coupons > 0 || $alert_cancelled_today > 0): ?>
            <div class="alerts-row">
                <?php if($alert_low_stock > 0): ?>
                    <div class="alert-pill alert-danger">⚠️ <?=$alert_low_stock?> Low stock products (≤ 5)</div>
                <?php endif; ?>
                <?php if($alert_pending_old > 0): ?>
                    <div class="alert-pill alert-warning">⏳ <?=$alert_pending_old?> Pending orders > 48h</div>
                <?php endif; ?>
                <?php if($alert_expiring_coupons > 0): ?>
                    <div class="alert-pill alert-warning">🎫 <?=$alert_expiring_coupons?> Coupons expiring within 7 days</div>
                <?php endif; ?>
                <?php if($alert_cancelled_today > 0): ?>
                    <div class="alert-pill alert-danger">❌ <?=$alert_cancelled_today?> Orders cancelled today</div>
                <?php endif; ?>
            </div>
            <?php endif; ?>

            <!-- Quick Action Buttons -->
            <div class="quick-actions-row">
                <a href="products.php" class="btn btn-outline btn-sm">➕ Add Product</a>
                <a href="orders.php?status=pending" class="btn btn-outline btn-sm">📦 Pending Orders</a>
                <a href="coupons.php" class="btn btn-outline btn-sm">🏷️ Coupons</a>
                <a href="analytics.php" class="btn btn-outline btn-sm">📊 Analytics</a>
            </div>

            <!-- KPI Cards -->
            <div class="kpis-grid">
                <div class="kpi-card">
                    <div class="kpi-top">
                        <div class="kpi-icon">💰</div>
                        <span class="kpi-change up">↑ +12%</span>
                    </div>
                    <div class="kpi-value">₹<span data-target="<?=round($kpi_rev)?>">0</span></div>
                    <div class="kpi-label">Total Revenue</div>
                </div>
                
                <div class="kpi-card">
                    <div class="kpi-top">
                        <div class="kpi-icon">📦</div>
                        <span class="kpi-change up">↑ +5%</span>
                    </div>
                    <div class="kpi-value" data-target="<?=$kpi_orders_today?>">0</div>
                    <div class="kpi-label">Orders Today</div>
                </div>
                
                <div class="kpi-card">
                    <div class="kpi-top">
                        <div class="kpi-icon">👥</div>
                        <span class="kpi-change up">↑ +8%</span>
                    </div>
                    <div class="kpi-value" data-target="<?=$kpi_active_customers?>">0</div>
                    <div class="kpi-label">Active Customers</div>
                </div>
                
                <div class="kpi-card">
                    <div class="kpi-top">
                        <div class="kpi-icon">🚚</div>
                        <span class="kpi-change down">↓ -2%</span>
                    </div>
                    <div class="kpi-value" data-target="<?=$kpi_pending_shipments?>">0</div>
                    <div class="kpi-label">Pending Shipments</div>
                </div>
            </div>

            <!-- Charts Row -->
            <div class="charts-row">
                <div class="admin-card">
                    <div class="card-header">
                        <div class="card-header-left">
                            <div class="card-title-icon">📈</div>
                            <span class="card-title">Revenue (Last 12 Months)</span>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="chart-container">
                            <canvas id="revenueChart"></canvas>
                        </div>
                    </div>
                </div>

                <div class="admin-card">
                    <div class="card-header">
                        <div class="card-header-left">
                            <div class="card-title-icon">📊</div>
                            <span class="card-title">Orders by Status</span>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="chart-container">
                            <canvas id="statusChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Data Tables Row -->
            <div class="dashboard-grid">
                <!-- Recent Orders -->
                <div class="admin-card">
                    <div class="card-header">
                        <div class="card-header-left">
                            <div class="card-title-icon">🛒</div>
                            <span class="card-title">Recent Orders</span>
                        </div>
                        <div class="card-header-right">
                            <a href="orders.php" class="btn btn-ghost btn-sm">View All</a>
                        </div>
                    </div>
                    <div class="card-body" style="padding:0;">
                        <div class="tbl-wrapper" style="border:none;">
                            <table class="admin-table">
                                <thead>
                                    <tr>
                                        <th>Order ID</th>
                                        <th>Customer</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php if(empty($recent_orders)): ?>
                                        <tr><td colspan="5" style="text-align:center; padding: 20px;">No recent orders.</td></tr>
                                    <?php else: ?>
                                        <?php foreach($recent_orders as $o): ?>
                                        <tr>
                                            <td><a href="orders.php?search=<?=$o['id']?>" style="color:var(--brand-color); font-weight:600; text-decoration:none;">#<?=$o['id']?></a></td>
                                            <td><?=htmlspecialchars($o['customer'])?></td>
                                            <td><?=$o['amount']?></td>
                                            <td><span class="badge <?=getBadgeClass($o['status'])?>"><?=$o['status']?></span></td>
                                            <td><?=$o['date']?></td>
                                        </tr>
                                        <?php endforeach; ?>
                                    <?php endif; ?>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Top Products -->
                <div class="admin-card">
                    <div class="card-header">
                        <div class="card-header-left">
                            <div class="card-title-icon">⭐</div>
                            <span class="card-title">Top Products</span>
                        </div>
                    </div>
                    <div class="card-body" style="padding:0;">
                        <div class="tbl-wrapper" style="border:none;">
                            <table class="admin-table">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Stock</th>
                                        <th>Price</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php if(empty($top_products)): ?>
                                        <tr><td colspan="3" style="text-align:center; padding: 20px;">No active products.</td></tr>
                                    <?php else: ?>
                                        <?php foreach($top_products as $p): ?>
                                        <tr>
                                            <td>
                                                <div style="font-weight:500;"><?=htmlspecialchars($p['name'])?></div>
                                                <div style="font-size:12px; color:#64748b;"><?=htmlspecialchars($p['category'])?></div>
                                            </td>
                                            <td>
                                                <span class="badge <?=$p['stock']>5 ? 'b-success' : 'b-danger'?>"><?=$p['stock']?></span>
                                            </td>
                                            <td>₹<?=$p['sale']?></td>
                                        </tr>
                                        <?php endforeach; ?>
                                    <?php endif; ?>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

        </main>
    </div>
</div>

<script src="assets/admin.js"></script>
<script>
document.addEventListener("DOMContentLoaded", () => {
    // KPI Counter Animation
    const kpiElements = document.querySelectorAll('.kpi-value[data-target], .kpi-value span[data-target]');
    kpiElements.forEach(el => {
        const target = parseFloat(el.getAttribute('data-target'));
        const duration = 1500;
        const start = 0;
        const startTime = performance.now();
        
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // easeOutQuart
            const ease = 1 - Math.pow(1 - progress, 4);
            const current = start + (target - start) * ease;
            
            if(Number.isInteger(target)) {
                el.innerText = Math.floor(current);
            } else {
                el.innerText = current.toFixed(2);
            }
            
            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                el.innerText = target;
            }
        }
        if(target > 0) requestAnimationFrame(update);
    });

    // Charts
    const revCtx = document.getElementById('revenueChart').getContext('2d');
    new Chart(revCtx, {
        type: 'line',
        data: {
            labels: <?=json_encode($chart_labels)?>,
            datasets: [{
                label: 'Revenue (₹)',
                data: <?=json_encode($chart_data)?>,
                borderColor: '#eab308', // gold
                backgroundColor: 'rgba(234, 179, 8, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true, grid: { borderDash: [4, 4] } },
                x: { grid: { display: false } }
            }
        }
    });

    const statusCtx = document.getElementById('statusChart').getContext('2d');
    new Chart(statusCtx, {
        type: 'doughnut',
        data: {
            labels: <?=json_encode($status_labels)?>,
            datasets: [{
                data: <?=json_encode($status_data)?>,
                backgroundColor: <?=json_encode($status_bg)?>,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
});
</script>
</body>
</html>
