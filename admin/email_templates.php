<?php
require_once 'includes/auth.php';
$pageTitle  = 'Email Templates';
$activePage = 'email_templates';

// Mock Email Templates
$templates = [
  ['id'=>'ET01', 'name'=>'Order Confirmation', 'subject'=>'Your Chhotu Fashion Order #{{order_id}} is Confirmed!', 'status'=>'Active', 'last_updated'=>'01 Aug 2026'],
  ['id'=>'ET02', 'name'=>'Order Shipped', 'subject'=>'Great News! Your Order #{{order_id}} is on its way 🚚', 'status'=>'Active', 'last_updated'=>'25 Jul 2026'],
  ['id'=>'ET03', 'name'=>'Order Delivered', 'subject'=>'Your Order #{{order_id}} has been delivered. Enjoy!', 'status'=>'Active', 'last_updated'=>'15 Jul 2026'],
  ['id'=>'ET04', 'name'=>'Welcome Email', 'subject'=>'Welcome to the Chhotu Fashion Family! 👗', 'status'=>'Active', 'last_updated'=>'10 Jun 2026'],
  ['id'=>'ET05', 'name'=>'Forgot Password', 'subject'=>'Reset your Chhotu Fashion password', 'status'=>'Active', 'last_updated'=>'01 Jun 2026'],
  ['id'=>'ET06', 'name'=>'Low Stock Alert', 'subject'=>'[Admin] Low Stock Alert: {{product_name}}', 'status'=>'Draft', 'last_updated'=>'20 May 2026'],
  ['id'=>'ET07', 'name'=>'Cart Abandonment', 'subject'=>'You left something behind! Complete your purchase 🛍️', 'status'=>'Draft', 'last_updated'=>'05 May 2026'],
];
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📧</text></svg>">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Templates — Chhotu Fashion Admin</title>
  <link rel="stylesheet" href="assets/admin.css?v=<?= filemtime('assets/admin.css') ?>">
</head>
<body>
<div class="admin-wrapper">
  <?php include 'includes/sidebar.php'; ?>
  <div class="admin-main" id="adminMain">
    <?php include 'includes/topbar.php'; ?>
    <main class="admin-content">

      <div class="admin-card">
        <div class="card-header">
          <div class="card-header-left">
            <div class="card-title-icon">📧</div>
            <span class="card-title">Email Templates</span>
            <span class="card-count" id="tpl-count"><?= count($templates) ?></span>
          </div>
          <div class="card-header-right tbl-controls">
            <div class="search-box">
              <span class="search-icon">🔍</span>
              <input type="text" id="tpl-search" placeholder="Search templates…">
            </div>
            <select class="filter-sel" id="tpl-status-filter">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>

        <div class="card-body">
          <div class="tbl-wrapper">
            <table class="admin-table">
              <thead>
                <tr>
                  <th data-tbl="tpl" data-sort="id">ID</th>
                  <th data-tbl="tpl" data-sort="name">Template Name</th>
                  <th data-tbl="tpl" data-sort="subject">Subject Line</th>
                  <th data-tbl="tpl" data-sort="status">Status</th>
                  <th data-tbl="tpl" data-sort="last_updated">Last Updated</th>
                  <th class="no-sort">Actions</th>
                </tr>
              </thead>
              <tbody id="tpl-body"></tbody>
            </table>
          </div>
        </div>
        <div class="card-footer">
          <div class="tbl-info" id="tpl-info"></div>
          <div style="display:flex;align-items:center;gap:10px">
            <select class="per-page-sel" id="tpl-perpage">
              <option value="10" selected>10 / page</option>
              <option value="25">25 / page</option>
            </select>
            <div class="pagination" id="tpl-pagination"></div>
          </div>
        </div>
      </div>
    </main>
  </div>
</div>

<!-- Add/Edit Template Modal -->
<div class="modal-overlay" id="templateModal">
  <div class="modal-container modal-lg">
    <div class="modal-header">
      <div class="modal-title"><span>📧</span> <span id="modalHeading">Edit Template</span></div>
      <button class="modal-close" onclick="closeModal('templateModal')">✕</button>
    </div>
    <div class="modal-body">
      <form id="templateForm" onsubmit="saveTemplate(event)">
        <input type="hidden" id="tId">
        <div class="form-grid" style="margin-bottom:14px">
          <div class="form-group full">
            <label class="form-label">Template Name</label>
            <input type="text" class="form-control" id="tName" required>
          </div>
          <div class="form-group full">
            <label class="form-label">Subject Line</label>
            <input type="text" class="form-control" id="tSubject" required>
            <div style="font-size:12px;color:var(--muted);margin-top:6px">Variables allowed: {{order_id}}, {{customer_name}}, {{amount}}</div>
          </div>
          <div class="form-group">
            <label class="form-label">Status</label>
            <select class="form-control" id="tStatus">
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
            </select>
          </div>
          <div class="form-group full">
            <label class="form-label">HTML Content</label>
            <textarea class="form-control" id="tBody" rows="10" style="font-family:monospace;resize:vertical;"></textarea>
          </div>
        </div>
      </form>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal('templateModal')">Cancel</button>
      <button class="btn btn-gold" onclick="saveTemplate()">💾 Save Template</button>
    </div>
  </div>
</div>

<script src="assets/admin.js?v=<?= filemtime('assets/admin.js') ?>"></script>
<script>
const tplData = <?= json_encode($templates) ?>;

const tplTable = new AdminTable('tpl', {
  data: tplData,
  searchFields: ['name', 'subject'],
  perPage: 10,
  renderRow(row) {
    const statusMap = { 'Active':'b-success', 'Draft':'b-muted' };
    const cls = statusMap[row.status] || 'b-muted';
    return `<tr>
      <td><strong style="color:var(--gold)">${row.id}</strong></td>
      <td><span style="font-weight:500">${row.name}</span></td>
      <td><span style="color:var(--muted)">${row.subject}</span></td>
      <td><span class="badge ${cls}">${row.status}</span></td>
      <td style="color:var(--muted);font-size:12px">${row.last_updated}</td>
      <td>
        <button class="btn btn-sm btn-outline" onclick="editTemplate('${row.id}')">✏️ Edit</button>
      </td>
    </tr>`;
  }
});

// Dropdown filter
document.getElementById('tpl-status-filter').addEventListener('change', function() {
  tplTable.activeFilter = this.value;
  tplTable.currentPage = 1;
  tplTable._apply();
});

function editTemplate(id) {
  const tpl = tplData.find(t => t.id === id);
  if (!tpl) return;
  document.getElementById('tId').value = tpl.id;
  document.getElementById('tName').value = tpl.name;
  document.getElementById('tSubject').value = tpl.subject;
  ssSetValue('tStatus', tpl.status);
  document.getElementById('tBody').value = `<h1>${tpl.name}</h1>\n<p>Hello {{customer_name}},</p>\n<p>Content goes here...</p>\n<p>Thanks,\nChhotu Fashion Team</p>`;
  document.getElementById('modalHeading').textContent = 'Edit Template: ' + tpl.name;
  openModal('templateModal');
}

function saveTemplate(e) {
  if (e) e.preventDefault();
  const id = document.getElementById('tId').value;
  const tpl = tplData.find(t => t.id === id);
  if (tpl) {
    tpl.name = document.getElementById('tName').value;
    tpl.subject = document.getElementById('tSubject').value;
    tpl.status = document.getElementById('tStatus').value;
    const now = new Date();
    tpl.last_updated = ('0'+now.getDate()).slice(-2) + ' ' + now.toLocaleString('en-US',{month:'short'}) + ' ' + now.getFullYear();
    tplTable._apply();
  }
  closeModal('templateModal');
  showToast('✅ Template updated successfully!', 'success');
}
</script>
</body>
</html>
