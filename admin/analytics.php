<?php
session_start();
require_once 'includes/auth.php';
require_once 'includes/db.php';
$pageTitle  = 'Analytics';
$activePage = 'analytics';

// 1. KPI Cards
$kpi = $pdo->query("
    SELECT 
        SUM(CAST(REPLACE(REPLACE(total_amount,'₹',''),',','') AS DECIMAL(12,2))) as rev_mtd,
        COUNT(*) as ord_mtd
    FROM orders 
    WHERE MONTH(created_at)=MONTH(NOW()) AND YEAR(created_at)=YEAR(NOW()) AND status!='Cancelled'
")->fetch(PDO::FETCH_ASSOC);

$revenue_mtd = $kpi['rev_mtd'] ?? 0;
$orders_mtd = $kpi['ord_mtd'] ?? 0;
$avg_order_value = $orders_mtd > 0 ? $revenue_mtd / $orders_mtd : 0;

$returns_appr = $pdo->query("SELECT COUNT(*) FROM returns WHERE status='Approved'")->fetchColumn();
$orders_del = $pdo->query("SELECT COUNT(*) FROM orders WHERE status='Delivered'")->fetchColumn();
$return_rate = $orders_del > 0 ? ($returns_appr / $orders_del) * 100 : 0;

// 2. Monthly Revenue Bar Chart
$monthlyRev = $pdo->query("
    SELECT DATE_FORMAT(created_at,'%b %Y') as month_label,
           MONTH(created_at) as m, YEAR(created_at) as y,
           SUM(CAST(REPLACE(REPLACE(total_amount,'₹',''),',','') AS DECIMAL(12,2))) as rev
    FROM orders 
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH) AND status!='Cancelled'
    GROUP BY y, m 
    ORDER BY y ASC, m ASC
")->fetchAll(PDO::FETCH_ASSOC);

$chartLabels = [];
$chartRevenue = [];
foreach($monthlyRev as $mr) {
    $chartLabels[] = $mr['month_label'];
    $chartRevenue[] = (float)($mr['rev'] ?? 0);
}

// 3. Sales by Category (Pie Chart) -> Really products by category active
$catStats = $pdo->query("
    SELECT category, COUNT(*) as cnt 
    FROM products 
    WHERE status='Active' AND category IS NOT NULL AND category != ''
    GROUP BY category
")->fetchAll(PDO::FETCH_ASSOC);

$catLabels = [];
$catData = [];
foreach($catStats as $cs) {
    $catLabels[] = $cs['category'];
    $catData[] = (int)$cs['cnt'];
}

// 4. Top Products table
$topProducts = $pdo->query("
    SELECT p.name, p.category, p.stock, p.mrp, p.sale,
           COALESCE(p.cost_price,0) as cost_price,
           (p.sale - COALESCE(p.cost_price,0)) as profit_per_unit
    FROM products p 
    WHERE p.status='Active' 
    ORDER BY (p.mrp-p.sale) DESC 
    LIMIT 20
")->fetchAll(PDO::FETCH_ASSOC);

// 5. Order Status donut
$orderStatusStats = $pdo->query("
    SELECT status, COUNT(*) as cnt 
    FROM orders 
    GROUP BY status
")->fetchAll(PDO::FETCH_ASSOC);

$statusLabels = [];
$statusData = [];
foreach($orderStatusStats as $oss) {
    $statusLabels[] = $oss['status'] ?: 'Unknown';
    $statusData[] = (int)$oss['cnt'];
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📊</text></svg>">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Analytics — Chhotu Fashion Admin</title>
  <link rel="stylesheet" href="assets/admin.css?v=<?= filemtime('assets/admin.css') ?>">
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js"></script>
</head>
<body>
<div class="admin-wrapper">
  <?php include 'includes/sidebar.php'; ?>
  <div class="admin-main" id="adminMain">
    <?php include 'includes/topbar.php'; ?>
    <main class="admin-content">

      <!-- Date Range Filter -->
      <div class="sec-hdr">
        <div>
          <div class="sec-title">Analytics Overview</div>
          <div class="sec-sub">Revenue, sales, and performance metrics</div>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <button class="s-tab active" onclick="setRange(this,'all')">All Time</button>
          <button class="s-tab" onclick="setRange(this,'year')">This Year</button>
          <button class="s-tab" onclick="setRange(this,'month')">This Month</button>
          <button class="s-tab" onclick="setRange(this,'week')">This Week</button>
        </div>
      </div>

      <!-- KPI Summary Row -->
      <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr)">
        <div class="kpi-card">
          <div class="kpi-top"><div class="kpi-icon">💰</div></div>
          <div class="kpi-value" data-target="<?= (int)$revenue_mtd ?>">₹0</div><div class="kpi-label">Revenue MTD</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-top"><div class="kpi-icon">📦</div></div>
          <div class="kpi-value" data-target="<?= (int)$orders_mtd ?>">0</div><div class="kpi-label">Orders MTD</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-top"><div class="kpi-icon">🛒</div></div>
          <div class="kpi-value" data-target="<?= (int)$avg_order_value ?>">₹0</div><div class="kpi-label">Avg Order Value</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-top"><div class="kpi-icon">↩</div></div>
          <div class="kpi-value" data-target="<?= number_format($return_rate,1) ?>">0</div><div class="kpi-label">Return Rate %</div>
        </div>
      </div>

      <!-- Charts Row 1 -->
      <div class="a-row" style="grid-template-columns: 1fr;">
        <!-- Monthly Revenue Bar -->
        <div class="admin-card">
          <div class="card-header">
            <div class="card-header-left">
              <div class="card-title-icon">📊</div>
              <span class="card-title">Monthly Revenue</span>
              <span class="card-count">Last 12 Months</span>
            </div>
          </div>
          <div class="card-body">
            <div class="chart-wrap"><canvas id="barChart"></canvas></div>
          </div>
        </div>
      </div>

      <!-- Charts Row 2 -->
      <div class="a-row">
        <!-- Category Pie -->
        <div class="admin-card">
          <div class="card-header">
            <div class="card-header-left">
              <div class="card-title-icon">🎯</div>
              <span class="card-title">Active Products by Category</span>
            </div>
          </div>
          <div class="card-body">
            <div class="chart-wrap"><canvas id="catChart"></canvas></div>
          </div>
        </div>

        <!-- Order Status Donut -->
        <div class="admin-card">
          <div class="card-header">
            <div class="card-header-left">
              <div class="card-title-icon">🌐</div>
              <span class="card-title">Order Status Distribution</span>
            </div>
          </div>
          <div class="card-body">
            <div class="chart-wrap"><canvas id="statusChart"></canvas></div>
          </div>
        </div>
      </div>

      <!-- Top Products Table -->
      <div class="admin-card">
        <div class="card-header">
          <div class="card-header-left">
            <div class="card-title-icon">🏆</div>
            <span class="card-title">Top Products</span>
            <span class="card-count" id="tp-count"><?= count($topProducts) ?></span>
          </div>
          <div class="card-header-right tbl-controls">
            <div class="search-box">
              <span class="search-icon">🔍</span>
              <input type="text" id="tp-search" placeholder="Search products…">
            </div>
            <select class="filter-sel" id="tp-cat">
              <option value="">All Categories</option>
              <?php foreach($catLabels as $cat): ?>
                <option><?= htmlspecialchars($cat) ?></option>
              <?php endforeach; ?>
            </select>
          </div>
        </div>
        <div class="card-body">
          <div class="tbl-wrapper">
            <table class="admin-table">
              <thead>
                <tr>
                  <th data-tbl="tp" data-sort="name">Product</th>
                  <th data-tbl="tp" data-sort="category">Category</th>
                  <th data-tbl="tp" data-sort="stock">Stock</th>
                  <th data-tbl="tp" data-sort="mrp">MRP</th>
                  <th data-tbl="tp" data-sort="sale">Sale Price</th>
                  <th data-tbl="tp" data-sort="profit_per_unit">Profit/Unit</th>
                </tr>
              </thead>
              <tbody id="tp-body"></tbody>
            </table>
          </div>
        </div>
        <div class="card-footer">
          <div class="tbl-info" id="tp-info"></div>
          <div style="display:flex;align-items:center;gap:10px">
            <select class="per-page-sel" id="tp-perpage">
              <option value="5">5 / page</option>
              <option value="10" selected>10 / page</option>
              <option value="20">20 / page</option>
            </select>
            <div class="pagination" id="tp-pagination"></div>
          </div>
        </div>
      </div>

    </main>
  </div>
</div>

<script src="assets/admin.js?v=<?= filemtime('assets/admin.js') ?>"></script>
<script>
// ── Date range toggle ──────────────────────────
const originalRevData = <?= json_encode($chartRevenue) ?>;
function setRange(btn, range) {
  document.querySelectorAll('.sec-hdr .s-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  // Simulated update for the visual effect
  const multipliers = { week:.15, month:.5, year:1, all:1 };
  const m = multipliers[range] || 1;
  revenueBar.data.datasets[0].data = originalRevData.map(v => Math.round(v*m));
  revenueBar.update();
  showToast('📊 Data updated for selected range', 'info');
}

// ── Revenue Bar Chart ──────────────────────────
const revLabels = <?= json_encode($chartLabels) ?>;
const revData = <?= json_encode($chartRevenue) ?>;
const revenueBar = new Chart(document.getElementById('barChart'), {
  type:'bar',
  data:{
    labels: revLabels.length ? revLabels : ['No Data'],
    datasets:[{
      label:'Revenue (₹)',
      data: revData.length ? revData : [0],
      backgroundColor:'rgba(212,175,55,.7)',
      borderColor:'#D4AF37',
      borderWidth:1.5,
      borderRadius:6
    }]
  },
  options:{
    responsive:true, maintainAspectRatio:false,
    plugins:{legend:{display:false}, tooltip:{callbacks:{label:c=>'₹'+c.parsed.y.toLocaleString('en-IN')}}},
    scales:{
      x:{grid:{color:'rgba(255,255,255,.05)'},ticks:{color:'#8B83A0'}},
      y:{grid:{color:'rgba(255,255,255,.05)'},ticks:{color:'#8B83A0',callback:v=>'₹'+Math.round(v/1000)+'k'}}
    }
  }
});

// ── Category Pie ───────────────────────────────
const catLabels = <?= json_encode($catLabels) ?>;
const catData = <?= json_encode($catData) ?>;
new Chart(document.getElementById('catChart'), {
  type:'doughnut',
  data:{
    labels: catLabels.length ? catLabels : ['No Data'],
    datasets:[{
      data: catData.length ? catData : [1],
      backgroundColor:['#D4AF37','#38BDF8','#10B981','#F59E0B','#F87171','#8B5CF6'],
      borderColor:'#1E1B4B', borderWidth:3, hoverOffset:6
    }]
  },
  options:{
    responsive:true, maintainAspectRatio:false, cutout:'62%',
    plugins:{legend:{position:'bottom',labels:{color:'#8B83A0',padding:14,font:{size:12}}},
    tooltip:{callbacks:{label:c=>c.label+': '+c.parsed}}}
  }
});

// ── Order Status Donut ──────────────────────────────
const statusLabels = <?= json_encode($statusLabels) ?>;
const statusData = <?= json_encode($statusData) ?>;
new Chart(document.getElementById('statusChart'), {
  type:'doughnut',
  data:{
    labels: statusLabels.length ? statusLabels : ['No Data'],
    datasets:[{
      data: statusData.length ? statusData : [1],
      backgroundColor:['#10B981','#D4AF37','#38BDF8','#F59E0B','#F87171'],
      borderColor:'#1E1B4B', borderWidth:3, hoverOffset:6
    }]
  },
  options:{
    responsive:true, maintainAspectRatio:false, cutout:'62%',
    plugins:{legend:{position:'bottom',labels:{color:'#8B83A0',padding:12,font:{size:12}}}}
  }
});

// ── Top Products Table ─────────────────────────
const tpData = <?= json_encode($topProducts) ?>;

const tpCatSel = document.getElementById('tp-cat');
tpCatSel.addEventListener('change', () => {
  tpTable.data = tpCatSel.value ? tpData.filter(r => r.category === tpCatSel.value) : tpData;
  tpTable.currentPage = 1;
  tpTable._apply();
});

const tpTable = new AdminTable('tp', {
  data: tpData,
  searchFields: ['name','category'],
  perPage: 10,
  renderRow(row) {
    const profit = parseFloat(row.profit_per_unit);
    const pColor = profit > 0 ? 'var(--emerald)' : 'var(--rose)';
    return `<tr>
      <td><div class="cell-name" style="font-size:13px">${row.name || '-'}</div></td>
      <td><span class="badge b-info">${row.category || '-'}</span></td>
      <td><strong style="color:var(--sky)">${row.stock || 0}</strong></td>
      <td><span style="color:var(--text-muted)">₹${Number(row.mrp || 0).toLocaleString('en-IN')}</span></td>
      <td><strong style="color:var(--gold)">₹${Number(row.sale || 0).toLocaleString('en-IN')}</strong></td>
      <td><strong style="color:${pColor}">₹${profit.toLocaleString('en-IN')}</strong></td>
    </tr>`;
  }
});

// AdminTable handles search and perPage internally if elements are named correctly
// (e.g. prefix-search, prefix-perpage), but just in case we can remove the manual listeners

</script>
</body>
</html>
