<?php $pageTitle = $pageTitle ?? 'Dashboard'; ?>
<header class="admin-topbar">

  <button class="sidebar-toggle" id="sidebarToggle" aria-label="Toggle sidebar">☰</button>

  <div class="topbar-breadcrumb">
    <h2><?= htmlspecialchars($pageTitle) ?></h2>
    <p class="bread-sub">Chhotu Fashion &rsaquo; Admin &rsaquo; <?= htmlspecialchars($pageTitle) ?></p>
  </div>

  <div class="topbar-actions">

    <!-- Global Search Trigger -->
    <button class="search-trigger" onclick="openGS()" title="Global Search (Ctrl+K)" id="gsBtn">
      🔍 <span style="font-size:13px;color:var(--muted)">Search…</span>
      <span class="search-trigger-kbd">Ctrl K</span>
    </button>

    <div class="topbar-divider"></div>

    <!-- Theme Switcher -->
    <div class="theme-switcher" title="Switch colour theme">
      <span class="theme-switcher-label">🎨</span>
      <div class="theme-dot" data-t="gold"     title="Royal Gold"></div>
      <div class="theme-dot" data-t="violet"   title="Midnight Violet"></div>
      <div class="theme-dot" data-t="emerald"  title="Emerald Elite"></div>
      <div class="theme-dot" data-t="sapphire" title="Sapphire Pro"></div>
      <div class="theme-dot" data-t="onyx"     title="Pure Onyx"></div>
    </div>

    <div class="topbar-divider"></div>

    <!-- Notifications -->
    <div style="position:relative">
      <button class="topbar-icon-btn" data-dd="notifMenu" title="Notifications">
        🔔<span class="notif-badge">5</span>
      </button>
      <div class="dropdown-menu" id="notifMenu">
        <div class="dropdown-item">📦 New order #CF1102</div>
        <div class="dropdown-item">💬 Customer review received</div>
        <div class="dropdown-item">⚠️ Low stock: Boys Kurta Set</div>
        <div class="dropdown-item">✅ Shipment #CF1089 delivered</div>
        <div class="dropdown-item">👤 New customer registered</div>
        <div class="dropdown-divider"></div>
        <a href="orders.php" class="dropdown-item" style="color:var(--gold)">View all →</a>
      </div>
    </div>

    <!-- User menu -->
    <div class="topbar-user" data-dd="userMenu" style="position:relative">
      <div class="profile-avatar"><?= strtoupper(substr($admin_name, 0, 1)) ?></div>
      <span class="u-name"><?= htmlspecialchars($admin_name) ?></span>
      <span style="color:var(--muted);font-size:11px">▾</span>
      <div class="dropdown-menu" id="userMenu">
        <a href="settings.php" class="dropdown-item">⚙️ Settings</a>
        <div class="dropdown-divider"></div>
        <a href="?logout=1" class="dropdown-item danger">🚪 Logout</a>
      </div>
    </div>

  </div>
</header>

<!-- ── Global Search Overlay (shared across all pages) ── -->
<div class="gs-overlay" id="gsOverlay">
  <div class="gs-box">
    <div class="gs-input-row">
      <span class="gs-ico">🔍</span>
      <input type="text" class="gs-input" id="gsInput" placeholder="Search pages, features…" autocomplete="off">
      <button class="gs-esc" onclick="closeGS()">ESC</button>
    </div>
    <div class="gs-results" id="gsResults"></div>
    <div class="gs-footer">
      <span><kbd>↑↓</kbd> Navigate</span>
      <span><kbd>↵</kbd> Open</span>
      <span><kbd>Esc</kbd> Close</span>
      <span><kbd>Ctrl K</kbd> Toggle</span>
    </div>
  </div>
</div>
