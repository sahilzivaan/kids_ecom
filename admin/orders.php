<?php
require_once 'includes/auth.php';
require_once 'includes/db.php';
$pageTitle  = 'Orders';
$activePage = 'orders';

$stmt = $pdo->query("SELECT o.id, o.order_number, o.delivery_name as customer, o.items_count as items,
       o.total_amount as amount, CAST(REPLACE(REPLACE(o.total_amount,'₹',''),',','') AS DECIMAL(12,2)) as amount_num,
       o.payment_method as payment, o.status, o.tracking_number,
       DATE_FORMAT(o.created_at, '%d %b %Y') as date, o.created_at,
       o.shipping_address, o.delivery_phone, o.delivery_email, o.city,
       o.items as items_json, o.coupon_code, o.discount_amount
FROM orders o
ORDER BY o.created_at DESC");

$orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($orders as &$ord) {
    $ord['items_parsed'] = json_decode($ord['items_json'] ?? '[]', true) ?: [];
    unset($ord['items_json']);
}
unset($ord);
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📦</text></svg>">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Orders — Chhotu Fashion Admin</title>
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
            <div class="card-title-icon">📦</div>
            <span class="card-title">All Orders</span>
            <span class="card-count" id="ord-count"><?= count($orders) ?></span>
          </div>
          <div class="card-header-right tbl-controls">
            <div class="search-box">
              <span class="search-icon">🔍</span>
              <input type="text" id="ord-search" placeholder="Order ID or customer…">
            </div>
            <select class="filter-sel" id="ord-pay-filter">
              <option value="">All Payments</option>
              <option>COD</option><option>UPI</option>
              <option>Credit Card</option><option>Net Banking</option><option>Debit Card</option>
            </select>
            <button class="btn btn-outline btn-sm" onclick="exportOrders(this)">📥 Export</button>
          </div>
        </div>

        <!-- Status Tabs -->
        <div style="padding:14px 20px 0;background:rgba(0,0,0,.12)">
          <div class="status-tabs">
            <button class="s-tab active" data-tbl="ord" data-filter="all">All <span id="cnt-all"></span></button>
            <button class="s-tab" data-tbl="ord" data-filter="pending">Pending</button>
            <button class="s-tab" data-tbl="ord" data-filter="processing">Processing</button>
            <button class="s-tab" data-tbl="ord" data-filter="shipped">Shipped</button>
            <button class="s-tab" data-tbl="ord" data-filter="delivered">Delivered</button>
            <button class="s-tab" data-tbl="ord" data-filter="cancelled">Cancelled</button>
          </div>
        </div>

        <!-- Card Body -->
        <div class="card-body">
          <div class="tbl-wrapper">
            <table class="admin-table">
              <thead>
                <tr>
                  <th class="no-sort" style="width:40px"><input type="checkbox" id="ordSelectAll"></th>
                  <th data-tbl="ord" data-sort="id">Order ID</th>
                  <th data-tbl="ord" data-sort="customer">Customer</th>
                  <th data-tbl="ord" data-sort="items">Items</th>
                  <th data-tbl="ord" data-sort="amount_num">Amount</th>
                  <th data-tbl="ord" data-sort="payment">Payment</th>
                  <th data-tbl="ord" data-sort="status">Status</th>
                  <th data-tbl="ord" data-sort="date">Date</th>
                  <th class="no-sort">Actions</th>
                </tr>
              </thead>
              <tbody id="ord-body"></tbody>
            </table>
          </div>
        </div>

        <!-- Card Footer -->
        <div class="card-footer">
          <div class="tbl-info" id="ord-info"></div>
          <div style="display:flex;align-items:center;gap:10px">
            <select class="per-page-sel" id="ord-perpage">
              <option value="10" selected>10 / page</option>
              <option value="25">25 / page</option>
              <option value="50">50 / page</option>
            </select>
            <div class="pagination" id="ord-pagination"></div>
          </div>
        </div>
      </div>

    </main>
  </div>
</div>

<!-- Bulk Action Bar -->
<div id="bulkBar" style="display:none; position:fixed; bottom:24px; left:50%; transform:translateX(-50%); background:var(--navy-2); border:1px solid var(--gold-border); border-radius:12px; padding:12px 20px; display:flex; align-items:center; gap:12px; z-index:1000; box-shadow:0 8px 32px rgba(0,0,0,0.5)">
  <span id="bulkCount" style="color:var(--muted); font-size:13px"></span>
  <select id="bulkStatusSel" class="form-control" style="width:160px; padding:6px 10px">
    <option value="">Change Status...</option>
    <option>Processing</option>
    <option>Shipped</option>
    <option>Delivered</option>
    <option>Cancelled</option>
  </select>
  <button class="btn btn-gold btn-sm" onclick="applyBulkStatus()">Apply</button>
  <button class="btn btn-outline btn-sm" onclick="exportSelected()">📥 Export Selected</button>
  <button class="btn btn-ghost btn-sm" onclick="clearSelection()">✕ Clear</button>
</div>

<!-- ── View Order Modal ── -->
<div class="modal-overlay" id="viewOrderModal">
  <div class="modal-container modal-lg">
    <div class="modal-header">
      <div class="modal-title">📦 Order Details</div>
      <button class="modal-close" onclick="closeModal('viewOrderModal')">✕</button>
    </div>
    <div class="modal-body" id="orderDetailBody"></div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal('viewOrderModal')">Close</button>
      <button class="btn btn-outline btn-sm" id="btnPrintInvoice">🖨️ Print Invoice</button>
    </div>
  </div>
</div>

<!-- ── Update Status Modal ── -->
<div class="modal-overlay" id="updateStatusModal">
  <div class="modal-container modal-sm">
    <div class="modal-header">
      <div class="modal-title">⚙️ Update Order Status</div>
      <button class="modal-close" onclick="closeModal('updateStatusModal')">✕</button>
    </div>
    <div class="modal-body">
      <p style="color:var(--muted);font-size:13px;margin-bottom:14px">Order: <strong style="color:var(--gold)" id="updateOrderId"></strong></p>
      <div class="form-group">
        <label class="form-label">New Status</label>
        <select class="form-control" id="newStatusSel">
          <option value="Pending">Pending</option>
          <option value="Processing">Processing</option>
          <option value="Shipped">Shipped</option>
          <option value="Delivered">Delivered</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal('updateStatusModal')">Cancel</button>
      <button class="btn btn-gold" onclick="saveStatus()">✅ Update Status</button>
    </div>
  </div>
</div>

<!-- ── Tracking Modal ── -->
<div class="modal-overlay" id="trackingModal">
  <div class="modal-container modal-sm">
    <div class="modal-header">
      <div class="modal-title">🚚 Update Tracking</div>
      <button class="modal-close" onclick="closeModal('trackingModal')">✕</button>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label class="form-label">Tracking Number</label>
        <input type="text" class="form-control" id="trackingNumberInput" placeholder="e.g. AWB123456789">
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal('trackingModal')">Cancel</button>
      <button class="btn btn-gold" onclick="saveTracking()">✅ Save</button>
    </div>
  </div>
</div>

<script src="assets/admin.js?v=<?= filemtime('assets/admin.js') ?>"></script>
<script>
let ordData = <?= json_encode($orders) ?>;
let updatingOrderId = null;
let trackingOrderId = null;

// API Helper
async function callApi(url, data) {
  const r = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) });
  return r.json();
}

// Payment filter
const payFilter = document.getElementById('ord-pay-filter');
payFilter.addEventListener('change', () => {
  ordTable.data = payFilter.value
    ? ordData.filter(r => r.payment === payFilter.value)
    : ordData;
  ordTable.currentPage = 1;
  ordTable._apply();
  updateTabCounts();
});

// Table
const ordTable = new AdminTable('ord', {
  data: ordData,
  searchFields: ['id','order_number','customer','status','payment'],
  filterField: 'status',
  perPage: 10,
  renderRow(row) {
    const map = {Delivered:'b-success',Shipped:'b-info',Processing:'b-gold',Pending:'b-warning',Cancelled:'b-danger'};
    const cls = map[row.status]||'b-muted';
    return `<tr>
      <td><input type="checkbox" class="ord-cb" value="${row.id}" onchange="checkBulkBar()"></td>
      <td><strong style="color:var(--gold)">#${row.order_number || row.id}</strong></td>
      <td>
        <div class="cell-name">${row.customer || 'N/A'}</div>
        <div style="font-size:11px;color:var(--muted)">${row.city || ''}</div>
      </td>
      <td><span class="badge b-muted">${row.items} item${row.items>1?'s':''}</span></td>
      <td><strong>${row.amount}</strong></td>
      <td><span style="font-size:12px;color:var(--muted)">${row.payment || 'N/A'}</span></td>
      <td><span class="badge ${cls}">${row.status}</span></td>
      <td style="color:var(--muted);font-size:12px">${row.date}</td>
      <td><div class="row-actions">
        <button class="act-btn act-view"   title="View"          onclick="viewOrder('${row.id}')">👁</button>
        <button class="act-btn act-edit"   title="Update Status" onclick="openUpdateStatus('${row.id}','${row.status}')">⚙️</button>
        <button class="act-btn act-track"  title="Add Tracking"  onclick="openTracking('${row.id}','${row.tracking_number||''}')">🚚</button>
      </div></td>
    </tr>`;
  }
});

function updateTabCounts() {
  const total = ordData.length;
  document.getElementById('cnt-all').textContent = `(${total})`;
}
updateTabCounts();

// Bulk Actions
function checkBulkBar() {
    const checked = document.querySelectorAll('.ord-cb:checked');
    const bar = document.getElementById('bulkBar');
    if (checked.length > 0) {
        bar.style.display = 'flex';
        document.getElementById('bulkCount').textContent = checked.length + ' selected';
    } else {
        bar.style.display = 'none';
    }
}
document.getElementById('ordSelectAll').addEventListener('change', function() {
    document.querySelectorAll('.ord-cb').forEach(c => c.checked = this.checked);
    checkBulkBar();
});

async function applyBulkStatus() {
    const checked = Array.from(document.querySelectorAll('.ord-cb:checked')).map(c => c.value);
    const sel = document.getElementById('bulkStatusSel').value;
    if (!sel) return showToast('Please select a status', 'warning');
    if (!checked.length) return;
    
    const res = await callApi('api/order_api.php', {action: 'bulk_status', ids: checked, status: sel});
    if (res.success) {
        checked.forEach(id => {
            const r = ordData.find(o => o.id == id);
            if(r) r.status = sel;
        });
        ordTable._apply();
        clearSelection();
        showToast(res.message, 'success');
    } else {
        showToast(res.message, 'error');
    }
}

function clearSelection() {
    document.querySelectorAll('.ord-cb').forEach(c => c.checked = false);
    document.getElementById('ordSelectAll').checked = false;
    checkBulkBar();
}

function exportSelected() {
    const checked = Array.from(document.querySelectorAll('.ord-cb:checked')).map(c => c.value);
    if (!checked.length) return;
    const exportData = ordData.filter(o => checked.includes(o.id.toString()));
    
    const cols = [
      { key: r => r.order_number || `#${r.id}`, label: 'Order ID' },
      { key: r => r.customer || 'Guest', label: 'Customer' },
      { key: r => r.amount_num, label: 'Amount' },
      { key: 'status', label: 'Status' },
      { key: 'date', label: 'Date' }
    ];
    AdminExport.toCSV(exportData, 'selected_orders', cols);
}

// View Order
function viewOrder(id) {
  const row = ordData.find(r => r.id == id);
  if (!row) return;
  const map = {Delivered:'b-success',Shipped:'b-info',Processing:'b-gold',Pending:'b-warning',Cancelled:'b-danger'};
  const cls = map[row.status]||'b-muted';

  const tl = [
    {label:'Order Placed',   sub:'Payment confirmed',  state: row.status!=='Cancelled' ? 'done' : 'done'},
    {label:'Processing',     sub:'Preparing your order',state: ['Processing','Shipped','Delivered'].includes(row.status) ? 'done' : (row.status==='Cancelled'?'':'')},
    {label:'Shipped',        sub:'Out for delivery',   state: ['Shipped','Delivered'].includes(row.status) ? 'done' : (row.status==='Processing'?'current':'')},
    {label:'Delivered',      sub:'Order received',     state: row.status==='Delivered' ? 'current done' : ''},
  ];
  
  let discountInfo = '';
  if (row.discount_amount && Number(row.discount_amount) > 0) {
      discountInfo = `<div class="od-block"><div class="od-label">Discount</div><div class="od-val" style="color:var(--success)">-₹${row.discount_amount} (${row.coupon_code})</div></div>`;
  }

  document.getElementById('orderDetailBody').innerHTML = `
    <div class="od-grid">
      <div class="od-block"><div class="od-label">Order ID</div><div class="od-val" style="color:var(--gold);font-weight:700">#${row.order_number || row.id}</div></div>
      <div class="od-block"><div class="od-label">Status</div><div class="od-val"><span class="badge ${cls}">${row.status}</span></div></div>
      <div class="od-block"><div class="od-label">Customer</div><div class="od-val">${row.customer || 'N/A'}</div></div>
      <div class="od-block"><div class="od-label">Payment</div><div class="od-val">${row.payment || 'N/A'}</div></div>
      <div class="od-block"><div class="od-label">Total Amount</div><div class="od-val" style="color:var(--gold);font-weight:700">${row.amount || '₹'+row.amount_num}</div></div>
      ${discountInfo}
      <div class="od-block"><div class="od-label">Order Date</div><div class="od-val">${row.date}</div></div>
      <div class="od-block"><div class="od-label">Tracking Number</div><div class="od-val">${row.tracking_number || 'Not assigned yet'}</div></div>
    </div>
    
    <div style="background:rgba(255,255,255,0.05); padding:12px; border-radius:8px; margin-bottom:20px; font-size:13px">
        <strong>Shipping Address:</strong><br>
        ${row.shipping_address || ''}, ${row.city || ''}<br>
        <strong>Phone:</strong> ${row.delivery_phone || ''} | <strong>Email:</strong> ${row.delivery_email || ''}
    </div>

    <p style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:var(--muted);margin-bottom:10px">Order Items</p>
    <div class="od-items" style="margin-bottom:20px">
      ${row.items_parsed.map(it=>`
        <div class="od-item">
          <div class="prod-thumb"><img src="${it.image||''}" style="width:100%;height:100%;object-fit:cover;border-radius:4px" onerror="this.outerHTML='📦'"></div>
          <div class="od-item-info">
            <div class="od-item-name">${it.name || 'Product'}</div>
            <div class="od-item-meta">Size: ${it.size || 'N/A'} · Qty: ${it.qty || 1}</div>
          </div>
          <div class="od-item-price">₹${it.price || 0}</div>
        </div>`).join('')}
    </div>
    <p style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:var(--muted);margin-bottom:10px">Order Timeline</p>
    <div class="timeline">
      ${tl.map(t=>`<div class="tl-item ${t.state}"><div class="tl-dot"></div><div class="tl-text"><strong>${t.label}</strong>${t.sub}</div></div>`).join('')}
    </div>`;

  document.getElementById('btnPrintInvoice').setAttribute('onclick', `printInvoice('${row.id}')`);
  openModal('viewOrderModal');
}

// Print Invoice
function printInvoice(id) {
    const row = ordData.find(r => r.id == id);
    if (!row) return;
    const itemsHtml = row.items_parsed.map(it => `
        <tr>
            <td style="padding:8px; border-bottom:1px solid #ddd">${it.name || 'Product'}</td>
            <td style="padding:8px; border-bottom:1px solid #ddd">${it.qty || 1}</td>
            <td style="padding:8px; border-bottom:1px solid #ddd">₹${it.price || 0}</td>
            <td style="padding:8px; border-bottom:1px solid #ddd">₹${(it.qty||1)*(it.price||0)}</td>
        </tr>
    `).join('');
    
    let subtotal = row.amount_num;
    let discountRow = '';
    if (row.discount_amount && Number(row.discount_amount) > 0) {
        subtotal = Number(row.amount_num) + Number(row.discount_amount);
        discountRow = `
        <tr><td colspan="3" style="padding:8px; text-align:right">Discount (${row.coupon_code || ''})</td><td style="padding:8px">-₹${row.discount_amount}</td></tr>
        `;
    }

    const html = `
        <html><head><title>Invoice ${row.order_number || row.id}</title>
        <style>body{font-family:sans-serif; padding:20px; color:#333} table{width:100%; border-collapse:collapse} th{background:#eee; text-align:left}</style>
        </head><body>
        <h1>Chhotu Fashion</h1>
        <h2>Invoice / Bill of Supply</h2>
        <p><strong>Order ID:</strong> ${row.order_number || row.id}<br>
        <strong>Date:</strong> ${row.date}<br>
        <strong>Payment Method:</strong> ${row.payment}<br>
        <strong>Tracking Number:</strong> ${row.tracking_number || 'Not assigned yet'}</p>
        <hr>
        <h3>Billed To:</h3>
        <p>${row.customer || ''}<br>
        ${row.shipping_address || ''}<br>
        ${row.city || ''}<br>
        Phone: ${row.delivery_phone || ''}<br>
        Email: ${row.delivery_email || ''}</p>
        <table style="margin-top:20px;">
            <thead><tr><th style="padding:8px">Item</th><th style="padding:8px">Qty</th><th style="padding:8px">Price</th><th style="padding:8px">Total</th></tr></thead>
            <tbody>
                ${itemsHtml}
                ${discountRow}
                <tr><td colspan="3" style="padding:8px; text-align:right"><strong>Grand Total</strong></td><td style="padding:8px"><strong>₹${row.amount_num}</strong></td></tr>
            </tbody>
        </table>
        <p style="margin-top:40px; font-size:12px; color:#555">All prices are inclusive of GST as applicable.</p>
        <script>window.print();<\/script>
        </body></html>
    `;
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
}

// Update Status
function openUpdateStatus(id, current) {
  updatingOrderId = id;
  const row = ordData.find(r => r.id == id);
  document.getElementById('updateOrderId').textContent = '#' + (row ? row.order_number || row.id : id);
  ssSetValue('newStatusSel', current);
  openModal('updateStatusModal');
}
async function saveStatus() {
  const newStatus = document.getElementById('newStatusSel').value;
  const res = await callApi('api/order_api.php', {action: 'update_status', order_id: updatingOrderId, status: newStatus});
  if (res.success) {
      const row = ordData.find(r => r.id == updatingOrderId);
      if (row) row.status = newStatus;
      ordTable._apply();
      closeModal('updateStatusModal');
      showToast(res.message, 'success');
  } else {
      showToast(res.message, 'error');
  }
  updatingOrderId = null;
}

// Tracking
function openTracking(id, current) {
    trackingOrderId = id;
    document.getElementById('trackingNumberInput').value = current || '';
    openModal('trackingModal');
}
async function saveTracking() {
    const tracking = document.getElementById('trackingNumberInput').value;
    const res = await callApi('api/order_api.php', {action: 'update_tracking', order_id: trackingOrderId, tracking: tracking});
    if (res.success) {
        const row = ordData.find(r => r.id == trackingOrderId);
        if (row) row.tracking_number = tracking;
        ordTable._apply();
        closeModal('trackingModal');
        showToast(res.message, 'success');
    } else {
        showToast(res.message, 'error');
    }
}

// Export All
function exportOrders(btn) {
  const targetBtn = btn || event?.currentTarget || document.querySelector('[onclick*="exportOrders"]');
  const cols = [
    { key: r => r.order_number || `#${r.id}`, label: 'Order ID' },
    { key: r => r.customer || 'Guest', label: 'Customer' },
    { key: r => r.items, label: 'Items' },
    { key: r => `₹${Number(r.amount_num).toLocaleString('en-IN')}`, label: 'Amount' },
    { key: r => r.payment || 'UPI', label: 'Payment' },
    { key: 'status', label: 'Status' },
    { key: 'date', label: 'Date' }
  ];
  const exportData = (typeof ordTable !== 'undefined' && ordTable.filteredData) ? ordTable.filteredData : ordData;
  AdminExport.showMenu(targetBtn, (type) => {
    if (type === 'csv') AdminExport.toCSV(exportData, 'orders', cols);
    else if (type === 'excel') AdminExport.toExcel(exportData, 'orders', cols, 'Orders Summary Report');
    else if (type === 'pdf') AdminExport.toPDF(exportData, 'orders', cols, 'Orders Summary Report');
  });
}
</script>
</body>
</html>
