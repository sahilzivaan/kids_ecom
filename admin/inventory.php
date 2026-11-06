<?php
require_once 'includes/auth.php';
$pageTitle  = 'Inventory';
$activePage = 'inventory';

// ── Fetch all products with inventory data ──────────────────────────────────
$products = $pdo->query("
  SELECT p.*,
    (SELECT pi.image_url FROM product_images pi WHERE pi.product_id=p.id AND pi.is_primary=1 LIMIT 1) as primary_image
  FROM products p
  WHERE p.status != 'Deleted'
  ORDER BY p.stock ASC, p.name ASC
")->fetchAll();

// ── Summary counts ─────────────────────────────────────────────────────────
$totalProducts  = count($products);
$outOfStock     = count(array_filter($products, fn($p) => $p['stock'] == 0));
$lowStock       = count(array_filter($products, fn($p) => $p['stock'] > 0 && $p['stock'] <= 5));
$healthyStock   = count(array_filter($products, fn($p) => $p['stock'] > 5));
$totalStockValue = 0;
foreach ($products as $p) {
  $totalStockValue += ($p['sale'] ?? $p['mrp']) * $p['stock'];
}

// ── Categories for filter ──────────────────────────────────────────────────
$categories = $pdo->query("SELECT DISTINCT category FROM products WHERE status != 'Deleted' ORDER BY category")->fetchAll(PDO::FETCH_COLUMN);
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📋</text></svg>">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inventory — Chhotu Fashion Admin</title>
  <link rel="stylesheet" href="assets/admin.css?v=<?= filemtime('assets/admin.css') ?>">
</head>
<body>
<div class="admin-wrapper">
  <?php include 'includes/sidebar.php'; ?>
  <div class="admin-main" id="adminMain">
    <?php include 'includes/topbar.php'; ?>
    <main class="admin-content">

      <!-- Section Header -->
      <div class="sec-hdr" style="margin-bottom:20px">
        <div>
          <div class="sec-title">Inventory Management</div>
          <div class="sec-sub">Monitor stock levels, update quantities, and manage low-stock alerts.</div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
          <button class="btn btn-outline btn-sm" onclick="exportInventory(this)">📥 Export</button>
          <button class="btn btn-gold btn-sm" onclick="openModal('bulkUpdateModal')">✏️ Bulk Update Stock</button>
        </div>
      </div>

      <!-- KPI Summary -->
      <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:24px">
        <div class="kpi-card">
          <div class="kpi-top"><div class="kpi-icon">📦</div></div>
          <div class="kpi-value" data-target="<?= $totalProducts ?>"><?= $totalProducts ?></div>
          <div class="kpi-label">Total Products</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-top"><div class="kpi-icon">🚫</div><span class="kpi-change down">Critical</span></div>
          <div class="kpi-value" data-target="<?= $outOfStock ?>" style="color:var(--rose)"><?= $outOfStock ?></div>
          <div class="kpi-label">Out of Stock</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-top"><div class="kpi-icon">⚠️</div><span class="kpi-change down">Low</span></div>
          <div class="kpi-value" data-target="<?= $lowStock ?>" style="color:#F59E0B"><?= $lowStock ?></div>
          <div class="kpi-label">Low Stock (≤5)</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-top"><div class="kpi-icon">💰</div></div>
          <div class="kpi-value" style="font-size:18px">₹<?= number_format($totalStockValue) ?></div>
          <div class="kpi-label">Total Stock Value</div>
        </div>
      </div>

      <!-- Alert Banner -->
      <?php if ($outOfStock > 0 || $lowStock > 0): ?>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px">
        <?php if ($outOfStock > 0): ?>
        <div style="flex:1;min-width:240px;padding:12px 16px;background:rgba(248,113,113,0.12);border:1px solid rgba(248,113,113,0.3);border-radius:10px;display:flex;align-items:center;gap:10px">
          <span style="font-size:20px">🚫</span>
          <div>
            <div style="font-size:13px;font-weight:600;color:#F87171"><?= $outOfStock ?> product<?= $outOfStock>1?'s are':' is'?> out of stock</div>
            <div style="font-size:11px;color:var(--muted)">These are set to Draft automatically or need restocking.</div>
          </div>
        </div>
        <?php endif; ?>
        <?php if ($lowStock > 0): ?>
        <div style="flex:1;min-width:240px;padding:12px 16px;background:rgba(245,158,11,0.12);border:1px solid rgba(245,158,11,0.3);border-radius:10px;display:flex;align-items:center;gap:10px">
          <span style="font-size:20px">⚠️</span>
          <div>
            <div style="font-size:13px;font-weight:600;color:#F59E0B"><?= $lowStock ?> product<?= $lowStock>1?'s have':' has'?> low stock (≤ 5 units)</div>
            <div style="font-size:11px;color:var(--muted)">Restock soon to avoid running out.</div>
          </div>
        </div>
        <?php endif; ?>
      </div>
      <?php endif; ?>

      <!-- Inventory Table -->
      <div class="admin-card">
        <div class="card-header">
          <div class="card-header-left">
            <div class="card-title-icon">📋</div>
            <span class="card-title">Stock Levels</span>
            <span class="card-count" id="inv-count"><?= $totalProducts ?></span>
          </div>
          <div class="card-header-right tbl-controls">
            <div class="search-box">
              <span class="search-icon">🔍</span>
              <input type="text" id="inv-search" placeholder="Search product…">
            </div>
            <select class="filter-sel" id="inv-cat">
              <option value="">All Categories</option>
              <?php foreach ($categories as $cat): ?>
                <option><?= htmlspecialchars($cat) ?></option>
              <?php endforeach; ?>
            </select>
            <select class="filter-sel" id="inv-status-filter">
              <option value="">All Stock Levels</option>
              <option value="out">Out of Stock</option>
              <option value="low">Low Stock (≤5)</option>
              <option value="ok">Healthy (>5)</option>
            </select>
          </div>
        </div>
        <div class="card-body">
          <div class="tbl-wrapper">
            <table class="admin-table">
              <thead>
                <tr>
                  <th class="no-sort" style="width:40px"><input type="checkbox" id="invSelectAll" onchange="document.querySelectorAll('.inv-cb').forEach(c=>c.checked=this.checked)"></th>
                  <th data-tbl="inv" data-sort="name">Product</th>
                  <th data-tbl="inv" data-sort="category">Category</th>
                  <th data-tbl="inv" data-sort="sku">SKU</th>
                  <th data-tbl="inv" data-sort="stock">Stock</th>
                  <th data-tbl="inv" data-sort="sale">Sale Price</th>
                  <th data-tbl="inv" data-sort="stock_value">Stock Value</th>
                  <th class="no-sort">Actions</th>
                </tr>
              </thead>
              <tbody id="inv-body"></tbody>
            </table>
          </div>
        </div>
        <div class="card-footer">
          <div class="tbl-info" id="inv-info"></div>
          <div style="display:flex;align-items:center;gap:10px">
            <select class="per-page-sel" id="inv-perpage">
              <option value="20" selected>20 / page</option>
              <option value="50">50 / page</option>
              <option value="100">100 / page</option>
            </select>
            <div class="pagination" id="inv-pagination"></div>
          </div>
        </div>
      </div>

    </main>
  </div>
</div>

<!-- ── Update Stock Modal ── -->
<div class="modal-overlay" id="updateStockModal">
  <div class="modal-container modal-sm">
    <div class="modal-header">
      <div class="modal-title">📦 Update Stock</div>
      <button class="modal-close" onclick="closeModal('updateStockModal')">✕</button>
    </div>
    <div class="modal-body">
      <p style="color:var(--muted);font-size:13px;margin-bottom:14px">Product: <strong style="color:var(--platinum)" id="updateStockName"></strong></p>
      <input type="hidden" id="updateStockId">
      <div class="form-group">
        <label class="form-label">New Stock Quantity</label>
        <input type="number" class="form-control" id="updateStockQty" min="0" placeholder="Enter quantity…">
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal('updateStockModal')">Cancel</button>
      <button class="btn btn-gold" onclick="saveStock()">✅ Update Stock</button>
    </div>
  </div>
</div>

<!-- ── Bulk Update Modal ── -->
<div class="modal-overlay" id="bulkUpdateModal">
  <div class="modal-container modal-sm">
    <div class="modal-header">
      <div class="modal-title">✏️ Bulk Stock Update</div>
      <button class="modal-close" onclick="closeModal('bulkUpdateModal')">✕</button>
    </div>
    <div class="modal-body">
      <p style="color:var(--muted);font-size:13px;margin-bottom:14px">This will update all <strong style="color:var(--gold)" id="bulkCount2">selected</strong> products.</p>
      <div class="form-group">
        <label class="form-label">Action</label>
        <select class="form-control" id="bulkAction">
          <option value="set">Set to exact quantity</option>
          <option value="add">Add to existing stock</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Quantity</label>
        <input type="number" class="form-control" id="bulkQty" min="0" placeholder="Enter quantity…">
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal('bulkUpdateModal')">Cancel</button>
      <button class="btn btn-gold" onclick="applyBulkStock()">✅ Apply</button>
    </div>
  </div>
</div>

<script src="assets/admin.js?v=<?= filemtime('assets/admin.js') ?>"></script>
<script>
const invRaw = <?= json_encode($products) ?>;

// Build table-ready data
const invData = invRaw.map(p => ({
  id:          p.id,
  name:        p.name,
  category:    p.category,
  sku:         p.sku || '—',
  stock:       parseInt(p.stock),
  mrp:         parseFloat(p.mrp),
  sale:        parseFloat(p.sale || p.mrp),
  cost_price:  parseFloat(p.cost_price || 0),
  stock_value: parseFloat(p.sale || p.mrp) * parseInt(p.stock),
  status:      p.status,
  primary_image: p.primary_image || null,
}));

let filteredByLevel = invData;

function stockBadge(stock) {
  if (stock === 0) return '<span class="badge b-danger">Out of Stock</span>';
  if (stock <= 5)  return `<span class="badge" style="background:rgba(245,158,11,.18);color:#F59E0B;border:1px solid rgba(245,158,11,.3)">Low: ${stock}</span>`;
  return `<span class="badge b-success">${stock}</span>`;
}

const invTable = new AdminTable('inv', {
  data: invData,
  searchFields: ['name','category','sku'],
  perPage: 20,
  renderRow(row) {
    const thumb = row.primary_image
      ? `<img src="${row.primary_image}" style="width:36px;height:36px;border-radius:8px;object-fit:cover;border:1px solid var(--gold-border)">`
      : `<div style="width:36px;height:36px;border-radius:8px;background:var(--navy-2);display:flex;align-items:center;justify-content:center;font-size:18px">👗</div>`;
    const profit = row.cost_price > 0
      ? `<span style="font-size:11px;color:var(--emerald)">+₹${(row.sale-row.cost_price).toFixed(0)}/unit</span>`
      : '';
    return `<tr>
      <td><input type="checkbox" class="inv-cb" value="${row.id}"></td>
      <td><div style="display:flex;align-items:center;gap:10px">
        ${thumb}
        <div>
          <div style="font-size:13px;font-weight:500;max-width:220px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${row.name}</div>
          ${profit}
        </div>
      </div></td>
      <td><span class="badge b-info">${row.category}</span></td>
      <td><span style="font-size:12px;color:var(--muted);font-family:monospace">${row.sku}</span></td>
      <td>${stockBadge(row.stock)}</td>
      <td><strong>₹${row.sale.toLocaleString('en-IN')}</strong></td>
      <td><strong style="color:var(--gold)">₹${row.stock_value.toLocaleString('en-IN')}</strong></td>
      <td><div class="row-actions">
        <button class="act-btn act-edit" title="Update Stock" onclick="openUpdateStock(${row.id},'${row.name.replace(/'/g,'\\'')}',${row.stock})">✏️</button>
        <a class="act-btn act-view" href="products.php" title="Edit Product">🔗</a>
      </div></td>
    </tr>`;
  }
});

// Category filter
document.getElementById('inv-cat').addEventListener('change', applyFilters);
document.getElementById('inv-status-filter').addEventListener('change', applyFilters);

function applyFilters() {
  const cat   = document.getElementById('inv-cat').value;
  const level = document.getElementById('inv-status-filter').value;
  let d = invData;
  if (cat)   d = d.filter(r => r.category === cat);
  if (level === 'out') d = d.filter(r => r.stock === 0);
  else if (level === 'low') d = d.filter(r => r.stock > 0 && r.stock <= 5);
  else if (level === 'ok')  d = d.filter(r => r.stock > 5);
  invTable.data = d;
  invTable.currentPage = 1;
  invTable._apply();
}

// Update single stock
function openUpdateStock(id, name, currentStock) {
  document.getElementById('updateStockId').value  = id;
  document.getElementById('updateStockName').textContent = name;
  document.getElementById('updateStockQty').value = currentStock;
  openModal('updateStockModal');
}

async function saveStock() {
  const id  = document.getElementById('updateStockId').value;
  const qty = parseInt(document.getElementById('updateStockQty').value);
  if (isNaN(qty) || qty < 0) { showToast('Please enter a valid quantity','error'); return; }
  const res = await fetch('api/product_api.php', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({action:'update_stock', id: parseInt(id), stock: qty})
  });
  const json = await res.json();
  if (json.success) {
    const row = invData.find(r => r.id == id);
    if (row) { row.stock = qty; row.stock_value = row.sale * qty; }
    invTable._apply();
    closeModal('updateStockModal');
    showToast('✅ Stock updated successfully','success');
  } else {
    showToast('Error: ' + json.message, 'error');
  }
}

// Bulk stock update
function applyBulkStock() {
  const checked = [...document.querySelectorAll('.inv-cb:checked')].map(c => parseInt(c.value));
  if (!checked.length) { showToast('No products selected','warning'); return; }
  const qty    = parseInt(document.getElementById('bulkQty').value);
  const action = document.getElementById('bulkAction').value;
  if (isNaN(qty) || qty < 0) { showToast('Please enter a valid quantity','error'); return; }

  fetch('api/product_api.php', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({action:'bulk_stock', ids: checked, qty, mode: action})
  }).then(r => r.json()).then(json => {
    if (json.success) {
      // Update local data
      invData.forEach(row => {
        if (checked.includes(row.id)) {
          row.stock = action === 'set' ? qty : row.stock + qty;
          row.stock_value = row.sale * row.stock;
        }
      });
      invTable._apply();
      closeModal('bulkUpdateModal');
      showToast(`✅ Updated ${checked.length} product${checked.length>1?'s':''}`, 'success');
    } else {
      showToast('Error: ' + json.message, 'error');
    }
  });
}

// Export
function exportInventory(btn) {
  const cols = [
    { key: 'name',        label: 'Product Name' },
    { key: 'category',    label: 'Category' },
    { key: 'sku',         label: 'SKU' },
    { key: 'stock',       label: 'Stock' },
    { key: r => `₹${r.sale.toLocaleString('en-IN')}`, label: 'Sale Price' },
    { key: r => `₹${r.stock_value.toLocaleString('en-IN')}`, label: 'Stock Value' },
    { key: 'status',      label: 'Status' },
  ];
  AdminExport.showMenu(btn, type => {
    if (type==='csv')   AdminExport.toCSV(invData,'inventory',cols);
    if (type==='excel') AdminExport.toExcel(invData,'inventory',cols,'Inventory Stock Report');
    if (type==='pdf')   AdminExport.toPDF(invData,'inventory',cols,'Inventory Stock Report');
  });
}
</script>
</body>
</html>
