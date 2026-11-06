<?php
require_once 'includes/auth.php';
$pageTitle  = 'Customers';
$activePage = 'customers';

// Generate JWT for Admin to access API
$header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
$payload = json_encode(['iat' => time(), 'exp' => time() + 3600*24, 'uid' => 1, 'role' => 'admin']);
$base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
$base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
$signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, 'supersecretjwtkey1234567890123456', true);
$base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
$jwt = $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;

$options = [
    'http' => [
        'header'  => "Authorization: Bearer $jwt\r\n",
        'method'  => 'GET',
        'ignore_errors' => true
    ]
];
$context  = stream_context_create($options);
$response = @file_get_contents('http://localhost:8080/api/admin/customers', false, $context);
$data = json_decode($response, true);
$customers = $data['customers'] ?? [];

// Sort customers by joined date (descending) if joined_ts is present
usort($customers, function($a, $b) {
    $a_ts = $a['joined_ts'] ?? strtotime($a['joined']);
    $b_ts = $b['joined_ts'] ?? strtotime($b['joined']);
    return $b_ts <=> $a_ts;
});
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">`n  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>??</text></svg>">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Customers — Chhotu Fashion Admin</title>
  <link rel="stylesheet" href="assets/admin.css?v=<?= filemtime('assets/admin.css') ?>">
</head>
<body>
<div class="admin-wrapper">
  <?php include 'includes/sidebar.php'; ?>
  <div class="admin-main" id="adminMain">
    <?php include 'includes/topbar.php'; ?>
    <main class="admin-content">

      <div class="admin-card">
        <!-- Card Header -->
        <div class="card-header">
          <div class="card-header-left">
            <div class="card-title-icon">👥</div>
            <span class="card-title">All Customers</span>
            <span class="card-count" id="cust-count"><?= count($customers) ?></span>
          </div>
          <div class="card-header-right tbl-controls">
            <div class="search-box">
              <span class="search-icon">🔍</span>
              <input type="text" id="cust-search" placeholder="Name, email or phone…">
            </div>
            <div class="status-tabs" style="background:transparent;padding:0;gap:4px">
              <button class="s-tab active" data-tbl="cust" data-filter="all">All</button>
              <button class="s-tab" data-tbl="cust" data-filter="active">Active</button>
              <button class="s-tab" data-tbl="cust" data-filter="inactive">Inactive</button>
            </div>
            <button class="btn btn-outline btn-sm" onclick="exportCustomers(this)">📥 Export</button>
          </div>
        </div>

        <!-- Card Body -->
        <div class="card-body">
          <div class="tbl-wrapper">
            <table class="admin-table">
              <thead>
                <tr>
                  <th class="no-sort" style="width:40px"><input type="checkbox" onchange="document.querySelectorAll('.cust-cb').forEach(c=>c.checked=this.checked)"></th>
                  <th class="no-sort">Avatar</th>
                  <th data-tbl="cust" data-sort="name">Name</th>
                  <th data-tbl="cust" data-sort="email">Email</th>
                  <th data-tbl="cust" data-sort="city">City</th>
                  <th data-tbl="cust" data-sort="orders">Orders</th>
                  <th data-tbl="cust" data-sort="spent">Total Spent</th>
                  <th data-tbl="cust" data-sort="joined">Joined</th>
                  <th data-tbl="cust" data-sort="status">Status</th>
                  <th class="no-sort">Actions</th>
                </tr>
              </thead>
              <tbody id="cust-body"></tbody>
            </table>
          </div>
        </div>

        <!-- Card Footer -->
        <div class="card-footer">
          <div class="tbl-info" id="cust-info"></div>
          <div style="display:flex;align-items:center;gap:10px">
            <select class="per-page-sel" id="cust-perpage">
              <option value="10" selected>10 / page</option>
              <option value="25">25 / page</option>
              <option value="50">50 / page</option>
            </select>
            <div class="pagination" id="cust-pagination"></div>
          </div>
        </div>
      </div>

    </main>
  </div>
</div>

<!-- ── View Customer Modal ── -->
<div class="modal-overlay" id="viewCustModal">
  <div class="modal-container modal-lg">
    <div class="modal-header">
      <div class="modal-title">👤 Customer Profile</div>
      <button class="modal-close" onclick="closeModal('viewCustModal')">✕</button>
    </div>
    <div class="modal-body" id="custModalBody"></div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal('viewCustModal')">Close</button>
    </div>
  </div>
</div>

<!-- ── Block Confirmation Modal ── -->
<div class="modal-overlay" id="blockModal">
  <div class="modal-container modal-sm">
    <div class="modal-header">
      <div class="modal-title">⚠️ Confirm Action</div>
      <button class="modal-close" onclick="closeModal('blockModal')">✕</button>
    </div>
    <div class="modal-body" style="text-align:center;padding:28px 20px">
      <p style="color:var(--platinum);font-size:15px" id="blockMsg"></p>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal('blockModal')">Cancel</button>
      <button class="btn btn-danger" id="blockConfirmBtn">Confirm</button>
    </div>
  </div>
</div>

<script src="assets/admin.js?v=<?= filemtime('assets/admin.js') ?>"></script>
<script>
const custData = <?= json_encode($customers) ?>;

// Table
const custTable = new AdminTable('cust', {
  data: custData,
  searchFields: ['name','email','phone','city','status'],
  filterField: 'status',
  perPage: 10,
  renderRow(row) {
    const statusCls = row.status === 'Active' ? 'b-success' : 'b-muted';
    return `<tr>
      <td><input type="checkbox" class="cust-cb" value="${row.id}"></td>
      <td><div class="cust-avatar">${row.initials}</div></td>
      <td><div class="cell-name">${row.name}</div><div class="cell-sub">${row.phone}</div></td>
      <td><div style="font-size:13px;color:var(--muted)">${row.email}</div></td>
      <td><span style="font-size:13px">${row.city}</span></td>
      <td><strong style="color:var(--sky)">${row.orders}</strong></td>
      <td><strong style="color:var(--gold)">₹${Number(row.spent).toLocaleString('en-IN')}</strong></td>
      <td style="color:var(--muted);font-size:12px">${row.joined}</td>
      <td><span class="badge ${statusCls}">${row.status}</span></td>
      <td><div class="row-actions">
        <button class="act-btn act-view"   title="View Profile" onclick="viewCustomer(${row.id})">👁</button>
        <button class="act-btn act-delete" title="${row.status==='Active'?'Block':'Unblock'}" onclick="toggleBlock(${row.id},'${row.name}')">${row.status==='Active'?'🚫':'✅'}</button>
      </div></td>
    </tr>`;
  }
});

// View customer modal
function viewCustomer(id) {
  const row = custData.find(r => r.id === id);
  if (!row) return;
  const statusCls = row.status === 'Active' ? 'b-success' : 'b-muted';
  const sampleOrders = [
    {id:'CF10'+Math.floor(Math.random()*900+100), date:'15 Jun 2026', amount:'₹'+Math.floor(Math.random()*2000+500), status:'Delivered'},
    {id:'CF10'+Math.floor(Math.random()*900+100), date:'28 May 2026', amount:'₹'+Math.floor(Math.random()*2000+500), status:'Shipped'},
    {id:'CF10'+Math.floor(Math.random()*900+100), date:'10 Apr 2026', amount:'₹'+Math.floor(Math.random()*2000+500), status:'Delivered'},
  ].slice(0, Math.min(row.orders, 3));

  document.getElementById('custModalBody').innerHTML = `
    <div class="cp-header">
      <div class="cp-avatar">${row.initials}</div>
      <div>
        <h3 style="color:var(--platinum);font-size:16px;margin-bottom:4px">${row.name}</h3>
        <p style="color:var(--muted);font-size:13px">${row.email}</p>
        <p style="color:var(--muted);font-size:13px">${row.phone} · ${row.city}</p>
        <span class="badge ${statusCls}" style="margin-top:6px">${row.status}</span>
      </div>
    </div>
    <div class="cs-grid">
      <div class="cs-box"><div class="cs-val">${row.orders}</div><div class="cs-lbl">Total Orders</div></div>
      <div class="cs-box"><div class="cs-val" style="color:var(--gold)">₹${Number(row.spent).toLocaleString('en-IN')}</div><div class="cs-lbl">Total Spent</div></div>
      <div class="cs-box"><div class="cs-val" style="color:var(--sky)">₹${Math.round(row.spent/row.orders).toLocaleString('en-IN')}</div><div class="cs-lbl">Avg. Order</div></div>
    </div>
    <p style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:var(--muted);margin-bottom:10px">Recent Orders</p>
    <div class="tbl-wrapper">
      <table class="admin-table" style="font-size:13px">
        <thead><tr>
          <th class="no-sort">Order ID</th>
          <th class="no-sort">Date</th>
          <th class="no-sort">Amount</th>
          <th class="no-sort">Status</th>
        </tr></thead>
        <tbody>
          ${sampleOrders.map(o=>{
            const m={Delivered:'b-success',Shipped:'b-info',Processing:'b-gold',Pending:'b-warning'};
            return `<tr>
              <td><strong style="color:var(--gold)">#${o.id}</strong></td>
              <td style="color:var(--muted)">${o.date}</td>
              <td><strong>${o.amount}</strong></td>
              <td><span class="badge ${m[o.status]||'b-muted'}">${o.status}</span></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
    <p style="font-size:12px;color:var(--muted);margin-top:10px">Member since: <strong style="color:var(--platinum)">${row.joined}</strong></p>`;
  openModal('viewCustModal');
}

// Block / Unblock
let blockTargetId = null;
function toggleBlock(id, name) {
  const row = custData.find(r => r.id === id);
  if (!row) return;
  blockTargetId = id;
  const action = row.status === 'Active' ? 'Block' : 'Unblock';
  document.getElementById('blockMsg').innerHTML = `${action} customer <strong style="color:var(--gold)">${name}</strong>?`;
  document.getElementById('blockConfirmBtn').textContent = action;
  openModal('blockModal');
  document.getElementById('blockConfirmBtn').onclick = () => {
    row.status = row.status === 'Active' ? 'Inactive' : 'Active';
    custTable.data = custData;
    custTable._apply();
    closeModal('blockModal');
    showToast(`${row.status === 'Active' ? '✅ Customer unblocked' : '🚫 Customer blocked'}: ${name}`, row.status === 'Active' ? 'success' : 'warning');
  };
}

// Export customers (CSV, Excel, PDF)
function exportCustomers(btn) {
  const targetBtn = btn || event?.currentTarget || document.querySelector('[onclick*="exportCustomers"]');
  const cols = [
    { key: 'name', label: 'Full Name' },
    { key: 'email', label: 'Email Address' },
    { key: 'phone', label: 'Phone' },
    { key: 'city', label: 'City' },
    { key: 'orders', label: 'Total Orders' },
    { key: r => `₹${Number(r.spent || 0).toLocaleString('en-IN')}`, label: 'Total Spent' },
    { key: 'status', label: 'Status' },
    { key: 'joined', label: 'Joined Date' }
  ];
  const exportData = (typeof custTable !== 'undefined' && custTable.filteredData) ? custTable.filteredData : custData;
  AdminExport.showMenu(targetBtn, (type) => {
    if (type === 'csv') AdminExport.toCSV(exportData, 'customers', cols);
    else if (type === 'excel') AdminExport.toExcel(exportData, 'customers', cols, 'Customers Master Report');
    else if (type === 'pdf') AdminExport.toPDF(exportData, 'customers', cols, 'Customers Master Report');
  });
}
</script>
</body>
</html>
