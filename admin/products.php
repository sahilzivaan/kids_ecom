<?php
require_once 'includes/auth.php';
require_once 'includes/db.php';

$pageTitle  = 'Products';
$activePage = 'products';

// Fetch products
$stmt = $pdo->query("SELECT p.*, 
  (SELECT pi.image_url FROM product_images pi WHERE pi.product_id=p.id AND pi.is_primary=1 LIMIT 1) as primary_image
FROM products p
WHERE p.status != 'Deleted'
ORDER BY p.created_at DESC");
$products = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Fetch categories
$catStmt = $pdo->query("SELECT id, name FROM categories ORDER BY name");
$categories = $catStmt->fetchAll(PDO::FETCH_ASSOC);

// Low stock count
$lowStockCount = 0;
foreach ($products as $p) {
    if ((int)$p['stock'] <= 5) {
        $lowStockCount++;
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>👗</text></svg>">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Products — Chhotu Fashion Admin</title>
  <link rel="stylesheet" href="assets/admin.css?v=<?= filemtime('assets/admin.css') ?>">
</head>
<body>
<div class="admin-wrapper">
  <?php include 'includes/sidebar.php'; ?>
  <div class="admin-main" id="adminMain">
    <?php include 'includes/topbar.php'; ?>
    <main class="admin-content">

      <?php if ($lowStockCount > 0): ?>
      <div style="background:var(--card-bg); border-left:4px solid var(--warning); padding:12px 20px; border-radius:8px; margin-bottom:20px; display:flex; align-items:center; gap:10px;">
        <div style="font-size:20px;">⚠️</div>
        <div style="color:var(--platinum); font-weight:600;">
          <?= $lowStockCount ?> product<?= $lowStockCount > 1 ? 's' : '' ?> have low stock (≤5 units)
        </div>
      </div>
      <?php endif; ?>

      <div class="admin-card">
        <!-- Card Header -->
        <div class="card-header">
          <div class="card-header-left">
            <div class="card-title-icon">👗</div>
            <span class="card-title">All Products</span>
            <span class="card-count" id="prod-count"><?= count($products) ?></span>
          </div>
          <div class="card-header-right tbl-controls">
            <div class="search-box">
              <span class="search-icon">🔍</span>
              <input type="text" id="prod-search" placeholder="Search products…">
            </div>
            <select class="filter-sel" id="prod-cat-filter">
              <option value="">All Categories</option>
              <?php foreach($categories as $cat): ?>
                <option value="<?= htmlspecialchars($cat['name']) ?>"><?= htmlspecialchars($cat['name']) ?></option>
              <?php endforeach; ?>
            </select>
            <select class="filter-sel" id="prod-status-filter">
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
            </select>
            <button class="btn btn-outline btn-sm" onclick="exportProducts(this)">📥 Export</button>
            <button class="btn btn-gold" onclick="openAddModal()">＋ Add Product</button>
          </div>
        </div>

        <!-- Card Body -->
        <div class="card-body">
          <div class="tbl-wrapper">
            <table class="admin-table">
              <thead>
                <tr>
                  <th class="no-sort" style="width:40px"><input type="checkbox" id="selectAll" onchange="toggleAll(this)"></th>
                  <th class="no-sort">Image</th>
                  <th data-tbl="prod" data-sort="name">Product Name</th>
                  <th data-tbl="prod" data-sort="category">Category</th>
                  <th data-tbl="prod" data-sort="sale">Price</th>
                  <th data-tbl="prod" data-sort="stock">Stock</th>
                  <th data-tbl="prod" data-sort="status">Status</th>
                  <th class="no-sort">Actions</th>
                </tr>
              </thead>
              <tbody id="prod-body"></tbody>
            </table>
          </div>
        </div>

        <!-- Card Footer -->
        <div class="card-footer">
          <div class="tbl-info" id="prod-info"></div>
          <div style="display:flex;align-items:center;gap:10px">
            <select class="per-page-sel" id="prod-perpage">
              <option value="10" selected>10 / page</option>
              <option value="25">25 / page</option>
              <option value="50">50 / page</option>
            </select>
            <div class="pagination" id="prod-pagination"></div>
          </div>
        </div>
      </div>

    </main>
  </div>
</div>

<!-- ── Add / Edit Product Modal ── -->
<div class="modal-overlay" id="productModal">
  <div class="modal-container modal-lg">
    <div class="modal-header">
      <div class="modal-title"><span id="modalIcon">＋</span> <span id="modalHeading">Add Product</span></div>
      <button class="modal-close" onclick="closeModal('productModal')">✕</button>
    </div>
    <div class="modal-body">
      <form id="productForm" onsubmit="saveProduct(event)">
        <input type="hidden" id="pId">
        <div class="form-grid" style="margin-bottom:14px">

          <div class="form-group full">
            <label class="form-label">Product Images</label>
            <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap; margin-bottom:8px;">
              <button type="button" class="btn btn-gold" onclick="openMediaChoiceModal()">➕ Choose Images</button>
              <span style="font-size:12px; color:var(--muted)">Select from existing media library or upload from computer</span>
            </div>
          </div>

          <div class="form-group full">
            <label class="form-label">Product Name</label>
            <input type="text" class="form-control" id="pName" placeholder="e.g. Girls Lehenga Choli — Festive Red" required>
          </div>
          <div class="form-group">
            <label class="form-label">SKU</label>
            <input type="text" class="form-control" id="pSku" placeholder="PROD-001" required>
          </div>
          <div class="form-group">
            <label class="form-label">Category</label>
            <select class="form-control" id="pCategory">
              <?php foreach($categories as $cat): ?>
                <option value="<?= htmlspecialchars($cat['name']) ?>"><?= htmlspecialchars($cat['name']) ?></option>
              <?php endforeach; ?>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Status</label>
            <select class="form-control" id="pStatus">
              <option value="Active">Active</option><option value="Draft">Draft</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">MRP (₹)</label>
            <input type="number" step="0.01" class="form-control" id="pMrp" placeholder="999" min="0" required>
          </div>
          <div class="form-group">
            <label class="form-label">Sale Price (₹)</label>
            <input type="number" step="0.01" class="form-control" id="pSale" placeholder="799" min="0" required>
          </div>
          <div class="form-group">
            <label class="form-label">Cost Price (₹)</label>
            <input type="number" step="0.01" class="form-control" id="pCostPrice" placeholder="500" min="0">
          </div>
          <div class="form-group">
            <label class="form-label">Stock Quantity</label>
            <input type="number" class="form-control" id="pStock" placeholder="50" min="0" required>
          </div>
          <div class="form-group full">
            <label class="form-label">Sizes Available (comma separated)</label>
            <input type="text" class="form-control" id="pSizes" placeholder="XS, S, M, L, XL">
          </div>
          <div class="form-group full">
            <label class="form-label">Description</label>
            <textarea class="form-control" id="pDesc" placeholder="Product description…"></textarea>
          </div>
        </div>
      </form>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal('productModal')">Cancel</button>
      <button class="btn btn-gold" onclick="saveProduct(event)">💾 Save Product</button>
    </div>
  </div>
</div>

<!-- ── Delete Confirmation Modal ── -->
<div class="modal-overlay" id="deleteModal">
  <div class="modal-container modal-sm">
    <div class="modal-header">
      <div class="modal-title">🗑 Delete Product</div>
      <button class="modal-close" onclick="closeModal('deleteModal')">✕</button>
    </div>
    <div class="modal-body" style="text-align:center;padding:30px 22px">
      <div style="font-size:44px;margin-bottom:12px">⚠️</div>
      <p style="color:var(--platinum);font-size:15px;margin-bottom:6px">Are you sure you want to delete</p>
      <p style="color:var(--gold);font-weight:600;font-size:15px" id="delProductName"></p>
      <p style="color:var(--muted);font-size:13px;margin-top:8px">This action cannot be undone.</p>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal('deleteModal')">Cancel</button>
      <button class="btn btn-danger" onclick="confirmDelete()">🗑 Delete</button>
    </div>
  </div>
</div>

<script src="assets/admin.js?v=<?= filemtime('assets/admin.js') ?>"></script>
<script>
let prodData = <?= json_encode($products) ?>;
let deleteId = null;

// Helper to map category to emoji if no image
function getCategoryEmoji(cat) {
  if (!cat) return '👗';
  cat = cat.toLowerCase();
  if (cat.includes('boy')) return '👕';
  if (cat.includes('girl')) return '👗';
  if (cat.includes('baby')) return '🩱';
  if (cat.includes('ethnic')) return '👘';
  return '📦';
}

// ── API Call ─────────────────────────────────
async function callApi(url, data) {
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await r.json();
  } catch (e) {
    console.error(e);
    return { success: false, message: 'Network Error' };
  }
}

// ── Extra filters ──────────────────────────────
const catFilter    = document.getElementById('prod-cat-filter');
const statusFilter = document.getElementById('prod-status-filter');

[catFilter, statusFilter].forEach(el => {
  el.addEventListener('change', () => { prodTable.currentPage = 1; applyExtra(); });
});

function applyExtra() {
  const cat = catFilter.value;
  const st  = statusFilter.value;
  prodTable.data = prodData.filter(r =>
    (!cat || r.category === cat) && (!st || r.status === st)
  );
  prodTable._apply();
  document.getElementById('prod-count').textContent = prodTable.data.length;
}

// ── Stock badge ──────────────────────────────
function stockBadge(stock) {
  stock = parseInt(stock) || 0;
  if (stock === 0)  return `<span class="badge b-danger">Out of Stock</span>`;
  if (stock <= 5)   return `<span class="badge b-danger">Low (${stock})</span>`;
  if (stock <= 10)  return `<span class="badge b-warning">Low (${stock})</span>`;
  return `<span class="badge b-success">${stock} in stock</span>`;
}

// ── Table ──────────────────────────────────────
const prodTable = new AdminTable('prod', {
  data: prodData,
  searchFields: ['name','sku','category','status'],
  perPage: 10,
  renderRow(row) {
    const statusCls = row.status === 'Active' ? 'b-success' : 'b-danger'; // b-danger for Draft/Inactive
    const thumbHtml = row.primary_image 
      ? `<img src="${row.primary_image}" style="width:36px;height:36px;object-fit:cover;border-radius:6px">` 
      : `<div class="prod-thumb">${getCategoryEmoji(row.category)}</div>`;
    
    const mrp = parseFloat(row.mrp) || 0;
    const sale = parseFloat(row.sale) || 0;
    const discount = mrp > 0 ? Math.round((mrp - sale) / mrp * 100) : 0;
    const priceHtml = sale > 0 
      ? `<div style="font-weight:600;color:var(--gold)">₹${sale} <span style="font-size:11px;color:var(--emerald)">(${discount}% OFF)</span></div>
         <div style="font-size:11px;color:var(--muted);text-decoration:line-through">₹${mrp}</div>`
      : `<div style="font-weight:600;color:var(--gold)">₹${mrp}</div>`;
         
    return `<tr>
      <td><input type="checkbox" class="row-cb" value="${row.id}"></td>
      <td>${thumbHtml}</td>
      <td>
        <div class="cell-name">${row.name}</div>
        <div style="font-size:11px;color:var(--muted)">${row.sku || ''}</div>
      </td>
      <td><span class="badge b-info">${row.category || 'None'}</span></td>
      <td>${priceHtml}</td>
      <td>${stockBadge(row.stock)}</td>
      <td><span class="badge ${statusCls}">${row.status}</span></td>
      <td><div class="row-actions">
        <button class="act-btn act-edit" title="Edit"  onclick="editProduct(${row.id})">✏️</button>
        <button class="act-btn act-delete" title="Delete" onclick="deleteProduct(${row.id}, '${(row.name || '').replace(/'/g,"\\'")}')">🗑</button>
      </div></td>
    </tr>`;
  }
});

function toggleAll(cb) {
  document.querySelectorAll('.row-cb').forEach(c => c.checked = cb.checked);
}

// ── Add Modal ─────────────────────────────────
function openAddModal() {
  document.getElementById('modalIcon').textContent    = '＋';
  document.getElementById('modalHeading').textContent = 'Add Product';
  document.getElementById('pId').value = '';
  document.getElementById('productForm').reset();
  if (typeof ssSetValue === 'function') {
    ssSetValue('pStatus', 'Active');
    const firstCat = document.getElementById('pCategory').options[0]?.value;
    if (firstCat) ssSetValue('pCategory', firstCat);
  }
  openModal('productModal');
}

// ── Edit Modal ────────────────────────────────
function editProduct(id) {
  const row = prodData.find(r => r.id == id);
  if (!row) return;
  document.getElementById('modalIcon').textContent    = '✏️';
  document.getElementById('modalHeading').textContent = 'Edit Product';
  document.getElementById('pId').value       = row.id;
  document.getElementById('pName').value     = row.name || '';
  document.getElementById('pSku').value      = row.sku || '';
  document.getElementById('pMrp').value      = row.mrp || '';
  document.getElementById('pSale').value     = row.sale || '';
  document.getElementById('pCostPrice').value= row.cost_price || '';
  document.getElementById('pStock').value    = row.stock || '';
  document.getElementById('pSizes').value    = row.sizes || '';
  document.getElementById('pDesc').value     = row.description || '';
  
  if (typeof ssSetValue === 'function') {
    ssSetValue('pCategory', row.category || '');
    ssSetValue('pStatus', row.status || 'Draft');
  } else {
    document.getElementById('pCategory').value = row.category || '';
    document.getElementById('pStatus').value = row.status || 'Draft';
  }

  openModal('productModal');
}

// ── Save ─────────────────────────────────────
async function saveProduct(e) {
  if (e) e.preventDefault();
  const id    = document.getElementById('pId').value;
  const name  = document.getElementById('pName').value.trim();
  if (!name) return;

  const data = {
    action: id ? 'update' : 'create',
    id: id,
    name: name,
    sku: document.getElementById('pSku').value,
    category: document.getElementById('pCategory').value,
    status: document.getElementById('pStatus').value,
    mrp: document.getElementById('pMrp').value,
    sale: document.getElementById('pSale').value,
    cost_price: document.getElementById('pCostPrice').value,
    stock: document.getElementById('pStock').value,
    sizes: document.getElementById('pSizes').value,
    description: document.getElementById('pDesc').value
  };

  const res = await callApi('api/product_api.php', data);
  if (res.success) {
    showToast(id ? '✏️ Product updated successfully!' : '✅ Product added successfully!', 'success');
    closeModal('productModal');
    setTimeout(() => window.location.reload(), 1000);
  } else {
    showToast('⚠️ Error: ' + res.message, 'error');
  }
}

// ── Delete ────────────────────────────────────
function deleteProduct(id, name) {
  deleteId = id;
  document.getElementById('delProductName').textContent = '"' + name + '"';
  openModal('deleteModal');
}

async function confirmDelete() {
  if (!deleteId) return;
  const res = await callApi('api/product_api.php', { action: 'delete', id: deleteId });
  if (res.success) {
    showToast('🗑 Product deleted.', 'success');
    closeModal('deleteModal');
    setTimeout(() => window.location.reload(), 800);
  } else {
    showToast('⚠️ Error: ' + res.message, 'error');
  }
  deleteId = null;
}

// Export Products
function exportProducts(btn) {
  const cols = [
    { key: 'id', label: 'ID' },
    { key: 'sku', label: 'SKU' },
    { key: 'name', label: 'Product Name' },
    { key: 'category', label: 'Category' },
    { key: r => `₹${Number(r.mrp || 0).toLocaleString('en-IN')}`, label: 'MRP' },
    { key: r => `₹${Number(r.sale || 0).toLocaleString('en-IN')}`, label: 'Sale Price' },
    { key: 'stock', label: 'Stock Qty' },
    { key: 'status', label: 'Status' }
  ];
  const exportData = (typeof prodTable !== 'undefined' && prodTable.filteredData) ? prodTable.filteredData : prodData;
  AdminExport.showMenu(btn, (type) => {
    if (type === 'csv') AdminExport.toCSV(exportData, 'products_catalog', cols);
    else if (type === 'excel') AdminExport.toExcel(exportData, 'products_catalog', cols, 'Products Catalog Report');
    else if (type === 'pdf') AdminExport.toPDF(exportData, 'products_catalog', cols, 'Products Catalog Report');
  });
}

function openMediaChoiceModal() {
  if (typeof openModal === 'function') {
    showToast('Media selector opens here. Upload logic goes in media library.', 'info');
  }
}
</script>
</body>
</html>
