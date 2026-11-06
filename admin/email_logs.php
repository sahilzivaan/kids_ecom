<?php
require_once 'includes/auth.php';
$pageTitle  = 'Email Logs';
$activePage = 'email_logs';

// Mock Email Logs
$logs = [
  ['id'=>'L8092', 'recipient'=>'priya.sharma@example.com', 'subject'=>'Your Chhotu Fashion Order #CF1102 is Confirmed!', 'status'=>'Sent', 'date'=>'01 Aug 2026, 14:32'],
  ['id'=>'L8091', 'recipient'=>'rahul.gupta@example.com', 'subject'=>'Great News! Your Order #CF1101 is on its way 🚚', 'status'=>'Sent', 'date'=>'01 Aug 2026, 12:15'],
  ['id'=>'L8090', 'recipient'=>'anjali.verma@example.com', 'subject'=>'Welcome to the Chhotu Fashion Family! 👗', 'status'=>'Sent', 'date'=>'01 Aug 2026, 09:45'],
  ['id'=>'L8089', 'recipient'=>'suresh.patel@example.com', 'subject'=>'Your Order #CF1099 has been delivered. Enjoy!', 'status'=>'Sent', 'date'=>'31 Jul 2026, 18:20'],
  ['id'=>'L8088', 'recipient'=>'meena.iyer@example.com', 'subject'=>'Reset your Chhotu Fashion password', 'status'=>'Sent', 'date'=>'31 Jul 2026, 16:05'],
  ['id'=>'L8087', 'recipient'=>'vikram.singh@example.com', 'subject'=>'Your Chhotu Fashion Order #CF1097 is Confirmed!', 'status'=>'Failed', 'date'=>'31 Jul 2026, 11:30'],
  ['id'=>'L8086', 'recipient'=>'kavitha.reddy@example.com', 'subject'=>'Welcome to the Chhotu Fashion Family! 👗', 'status'=>'Sent', 'date'=>'30 Jul 2026, 08:15'],
  ['id'=>'L8085', 'recipient'=>'admin@chhotufashion.in', 'subject'=>'[Admin] Low Stock Alert: Baby Romper Pack', 'status'=>'Sent', 'date'=>'29 Jul 2026, 23:45'],
  ['id'=>'L8084', 'recipient'=>'deepak.joshi@example.com', 'subject'=>'You left something behind! Complete your purchase 🛍️', 'status'=>'Failed', 'date'=>'29 Jul 2026, 14:10'],
  ['id'=>'L8083', 'recipient'=>'sunita.nair@example.com', 'subject'=>'Your Chhotu Fashion Order #CF1094 is Confirmed!', 'status'=>'Sent', 'date'=>'28 Jul 2026, 10:00'],
];
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📬</text></svg>">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Logs — Chhotu Fashion Admin</title>
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
            <div class="card-title-icon">📬</div>
            <span class="card-title">Email Logs</span>
            <span class="card-count" id="log-count"><?= count($logs) ?></span>
          </div>
          <div class="card-header-right tbl-controls">
            <div class="search-box">
              <span class="search-icon">🔍</span>
              <input type="text" id="log-search" placeholder="Search logs (email, subject)…">
            </div>
            <select class="filter-sel" id="log-status-filter">
              <option value="all">All Status</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
            </select>
            <button class="btn btn-outline" onclick="exportEmailLogs(this)">📥 Export</button>
            <button class="btn btn-outline" onclick="showToast('🔄 Syncing with mail server...', 'info')">Sync Logs</button>
          </div>
        </div>

        <div class="card-body">
          <div class="tbl-wrapper">
            <table class="admin-table">
              <thead>
                <tr>
                  <th data-tbl="log" data-sort="id">Log ID</th>
                  <th data-tbl="log" data-sort="recipient">Recipient</th>
                  <th data-tbl="log" data-sort="subject">Subject Line</th>
                  <th data-tbl="log" data-sort="status">Status</th>
                  <th data-tbl="log" data-sort="date">Date Sent</th>
                  <th class="no-sort">Actions</th>
                </tr>
              </thead>
              <tbody id="log-body"></tbody>
            </table>
          </div>
        </div>
        <div class="card-footer">
          <div class="tbl-info" id="log-info"></div>
          <div style="display:flex;align-items:center;gap:10px">
            <select class="per-page-sel" id="log-perpage">
              <option value="10" selected>10 / page</option>
              <option value="25">25 / page</option>
              <option value="50">50 / page</option>
            </select>
            <div class="pagination" id="log-pagination"></div>
          </div>
        </div>
      </div>
    </main>
  </div>
</div>

<!-- View Details Modal -->
<div class="modal-overlay" id="viewModal">
  <div class="modal-container">
    <div class="modal-header">
      <div class="modal-title"><span>📧</span> Email Details: <span id="vLogId"></span></div>
      <button class="modal-close" onclick="closeModal('viewModal')">✕</button>
    </div>
    <div class="modal-body">
      <div style="margin-bottom:15px; padding:12px; background:rgba(0,0,0,.15); border:1px solid var(--glass-b); border-radius:var(--r-sm);">
        <div style="margin-bottom:6px"><strong style="color:var(--muted)">To:</strong> <span id="vRecipient"></span></div>
        <div style="margin-bottom:6px"><strong style="color:var(--muted)">Subject:</strong> <span id="vSubject"></span></div>
        <div style="margin-bottom:6px"><strong style="color:var(--muted)">Date:</strong> <span id="vDate"></span></div>
        <div><strong style="color:var(--muted)">Status:</strong> <span id="vStatus"></span></div>
      </div>
      <div>
        <strong style="color:var(--muted); display:block; margin-bottom:8px">Message Preview:</strong>
        <div id="vContent" style="padding:15px; background:#ffffff; color:#333; border-radius:4px; font-family:sans-serif; min-height:150px;">
          <!-- Mock HTML Content -->
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal('viewModal')">Close</button>
      <button class="btn btn-outline" id="resendBtn" onclick="resendEmail()">Resend Email</button>
    </div>
  </div>
</div>

<script src="assets/admin.js?v=<?= filemtime('assets/admin.js') ?>"></script>
<script>
const logData = <?= json_encode($logs) ?>;

const logTable = new AdminTable('log', {
  data: logData,
  searchFields: ['id', 'recipient', 'subject'],
  perPage: 10,
  renderRow(row) {
    const statusMap = { 'Sent':'b-success', 'Failed':'b-danger' };
    const cls = statusMap[row.status] || 'b-muted';
    return `<tr>
      <td><strong style="color:var(--gold)">${row.id}</strong></td>
      <td><span style="font-weight:500">${row.recipient}</span></td>
      <td><span style="color:var(--muted)">${row.subject}</span></td>
      <td><span class="badge ${cls}">${row.status}</span></td>
      <td style="color:var(--muted);font-size:12px">${row.date}</td>
      <td>
        <button class="btn btn-sm btn-outline" onclick="viewLog('${row.id}')">👁️ View</button>
      </td>
    </tr>`;
  }
});

// Dropdown filter
document.getElementById('log-status-filter').addEventListener('change', function() {
  logTable.activeFilter = this.value;
  logTable.currentPage = 1;
  logTable._apply();
});

let currentViewId = null;

function viewLog(id) {
  const log = logData.find(l => l.id === id);
  if (!log) return;
  currentViewId = id;
  
  document.getElementById('vLogId').textContent = log.id;
  document.getElementById('vRecipient').textContent = log.recipient;
  document.getElementById('vSubject').textContent = log.subject;
  document.getElementById('vDate').textContent = log.date;
  
  const statusMap = { 'Sent':'b-success', 'Failed':'b-danger' };
  const cls = statusMap[log.status] || 'b-muted';
  document.getElementById('vStatus').innerHTML = `<span class="badge ${cls}">${log.status}</span>`;
  
  // Resend button logic
  const resendBtn = document.getElementById('resendBtn');
  if (log.status === 'Failed') {
    resendBtn.style.display = 'inline-block';
    resendBtn.textContent = 'Retry Sending';
    resendBtn.className = 'btn btn-gold';
  } else {
    resendBtn.style.display = 'inline-block';
    resendBtn.textContent = 'Resend Email';
    resendBtn.className = 'btn btn-outline';
  }

  // Mock content display
  document.getElementById('vContent').innerHTML = `
    <h2 style="color:#d4af37; margin-top:0">${log.subject}</h2>
    <p>Dear Customer,</p>
    <p>This is a simulated preview of the email content that was sent to <strong>${log.recipient}</strong>.</p>
    <p>Please check the respective templates for dynamic variable substitutions.</p>
    <br>
    <p>Thanks,<br>Chhotu Fashion Team</p>
  `;
  
  openModal('viewModal');
}

function resendEmail() {
  if (!currentViewId) return;
  const log = logData.find(l => l.id === currentViewId);
  if (!log) return;
  
  showToast(`🚀 Queued email to ${log.recipient} for resending.`, 'success');
  closeModal('viewModal');
}

// Export Email Logs (CSV, Excel, PDF)
function exportEmailLogs(btn) {
  const targetBtn = btn || event?.currentTarget || document.querySelector('[onclick*="exportEmailLogs"]');
  const cols = [
    { key: 'id', label: 'Log ID' },
    { key: 'recipient', label: 'Recipient' },
    { key: 'subject', label: 'Subject Line' },
    { key: 'status', label: 'Status' },
    { key: 'date', label: 'Date Sent' }
  ];
  const exportData = (typeof logTable !== 'undefined' && logTable.filteredData) ? logTable.filteredData : logData;
  AdminExport.showMenu(targetBtn, (type) => {
    if (type === 'csv') AdminExport.toCSV(exportData, 'email_logs', cols);
    else if (type === 'excel') AdminExport.toExcel(exportData, 'email_logs', cols, 'Email Dispatch Logs');
    else if (type === 'pdf') AdminExport.toPDF(exportData, 'email_logs', cols, 'Email Dispatch Logs');
  });
}
</script>
</body>
</html>
