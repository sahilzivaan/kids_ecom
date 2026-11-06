<?php $activePage = $activePage ?? ''; ?>
<?php
// Live sidebar counts (safe — $pdo is available from auth.php)
$sidebarProdCount    = 0;
$sidebarOrderAlert   = 0;
$sidebarReturnsAlert = 0;
$sidebarLowStock     = 0;
if (isset($pdo)) {
    $sidebarProdCount    = (int)$pdo->query("SELECT COUNT(*) FROM products WHERE status='Active'")->fetchColumn();
    $sidebarOrderAlert   = (int)$pdo->query("SELECT COUNT(*) FROM orders WHERE status IN ('Pending','Processing')")->fetchColumn();
    try { $sidebarReturnsAlert = (int)$pdo->query("SELECT COUNT(*) FROM returns WHERE status='Pending'")->fetchColumn(); } catch(Exception $e){}
    $sidebarLowStock     = (int)$pdo->query("SELECT COUNT(*) FROM products WHERE stock <= 5 AND status='Active'")->fetchColumn();
}
?>
<aside class="admin-sidebar" id="adminSidebar">

  <div class="sidebar-logo">
    <div class="logo-icon">👗</div>
    <div class="logo-text">
      <span class="brand">Chhotu Fashion</span>
      <span class="sub">Admin Panel</span>
    </div>
  </div>

  <nav class="sidebar-nav">
    <div class="nav-section-label">Main Menu</div>

    <a href="dashboard.php" class="nav-item <?= $activePage==='dashboard'?'active':'' ?>"
       data-tooltip="Dashboard">
      <span class="nav-icon">📊</span>
      <span class="nav-label">Dashboard</span>
    </a>

    <a href="products.php" class="nav-item <?= $activePage==='products'?'active':'' ?>"
       data-tooltip="Products">
      <span class="nav-icon">👗</span>
      <span class="nav-label">Products</span>
      <?php if ($sidebarProdCount > 0): ?>
        <span class="nav-badge"><?= $sidebarProdCount ?></span>
      <?php endif; ?>
    </a>

    <a href="media.php" class="nav-item <?= $activePage==='media'?'active':'' ?>"
       data-tooltip="Media Library">
      <span class="nav-icon">🖼️</span>
      <span class="nav-label">Media Library</span>
    </a>

    <a href="orders.php" class="nav-item <?= $activePage==='orders'?'active':'' ?>"
       data-tooltip="Orders">
      <span class="nav-icon">📦</span>
      <span class="nav-label">Orders</span>
      <?php if ($sidebarOrderAlert > 0): ?>
        <span class="nav-badge"><?= $sidebarOrderAlert ?></span>
      <?php endif; ?>
    </a>

    <a href="customers.php" class="nav-item <?= $activePage==='customers'?'active':'' ?>"
       data-tooltip="Customers">
      <span class="nav-icon">👥</span>
      <span class="nav-label">Customers</span>
    </a>

    <div class="nav-section-label">Store Management</div>

    <a href="coupons.php" class="nav-item <?= $activePage==='coupons'?'active':'' ?>"
       data-tooltip="Coupons">
      <span class="nav-icon">🏷️</span>
      <span class="nav-label">Coupons</span>
    </a>

    <a href="returns.php" class="nav-item <?= $activePage==='returns'?'active':'' ?>"
       data-tooltip="Returns & Refunds">
      <span class="nav-icon">↩️</span>
      <span class="nav-label">Returns & Refunds</span>
      <?php if ($sidebarReturnsAlert > 0): ?>
        <span class="nav-badge" style="background:#F87171;color:#fff"><?= $sidebarReturnsAlert ?></span>
      <?php endif; ?>
    </a>

    <a href="inventory.php" class="nav-item <?= $activePage==='inventory'?'active':'' ?>"
       data-tooltip="Inventory">
      <span class="nav-icon">📋</span>
      <span class="nav-label">Inventory</span>
      <?php if ($sidebarLowStock > 0): ?>
        <span class="nav-badge" style="background:#F59E0B;color:#1a1a2e"><?= $sidebarLowStock ?></span>
      <?php endif; ?>
    </a>

    <div class="nav-section-label">Analytics &amp; Reports</div>

    <a href="analytics.php" class="nav-item <?= $activePage==='analytics'?'active':'' ?>"
       data-tooltip="Analytics">
      <span class="nav-icon">📈</span>
      <span class="nav-label">Analytics</span>
    </a>

    <div class="nav-section-label">Communications</div>

    <a href="email_templates.php" class="nav-item <?= $activePage==='email_templates'?'active':'' ?>"
       data-tooltip="Email Templates">
      <span class="nav-icon">📧</span>
      <span class="nav-label">Email Templates</span>
    </a>

    <a href="email_logs.php" class="nav-item <?= $activePage==='email_logs'?'active':'' ?>"
       data-tooltip="Email Logs">
      <span class="nav-icon">📬</span>
      <span class="nav-label">Email Logs</span>
    </a>

    <div class="nav-section-label">Configuration</div>

    <a href="settings.php" class="nav-item <?= $activePage==='settings'?'active':'' ?>"
       data-tooltip="Settings">
      <span class="nav-icon">⚙️</span>
      <span class="nav-label">Settings</span>
    </a>
  </nav>

  <div class="sidebar-footer">
    <div class="admin-profile">
      <div class="profile-avatar"><?= strtoupper(substr($admin_name, 0, 1)) ?></div>
      <div class="profile-info">
        <span class="profile-name"><?= htmlspecialchars($admin_name) ?></span>
        <span class="profile-role">Super Admin</span>
      </div>
    </div>
    <a href="?logout=1" class="btn-logout" title="Logout">
      <span>🚪</span> <span class="logout-text">Logout</span>
    </a>
  </div>

</aside>
