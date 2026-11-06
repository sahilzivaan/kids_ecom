<?php
define('IS_LOGIN_PAGE', true);
require_once 'includes/auth.php';
// If already logged in, redirect to dashboard
if (!empty($_SESSION['admin_logged_in'])) {
    header('Location: dashboard.php'); exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Login — Chhotu Fashion</title>
  <meta name="robots" content="noindex,nofollow">
  <link rel="stylesheet" href="assets/admin.css?v=<?= filemtime('assets/admin.css') ?>">
</head>
<body>

<div class="login-page">
  <!-- Animated background orbs -->
  <div class="l-orb orb1"></div>
  <div class="l-orb orb2"></div>
  <div class="l-orb orb3"></div>

  <div class="login-card">
    <div class="login-logo">
      <div class="logo-circle">👗</div>
      <h1>Chhotu Fashion</h1>
      <p>Admin Command Center</p>
    </div>

    <?php if (!empty($login_error)): ?>
    <div class="login-error">❌ &nbsp;Invalid username or password. Please try again.</div>
    <?php endif; ?>

    <form class="login-form" method="POST" id="loginForm">
      <input type="hidden" name="login_action" value="1">

      <div class="form-group">
        <span class="field-icon">👤</span>
        <input
          type="text"
          id="username"
          name="username"
          class="form-control"
          placeholder="Username"
          required
          autocomplete="username"
          value="<?= isset($_POST['username']) ? htmlspecialchars($_POST['username']) : '' ?>"
        >
      </div>

      <div class="form-group">
        <span class="field-icon">🔒</span>
        <input
          type="password"
          id="password"
          name="password"
          class="form-control"
          placeholder="Password"
          required
          autocomplete="current-password"
        >
      </div>

      <button type="submit" class="btn-login" id="loginBtn">
        Sign In to Admin Panel
      </button>
    </form>

    <div class="login-hint">
      <p>Demo credentials: &nbsp;<strong>admin</strong> &nbsp;/&nbsp; <strong>admin123</strong></p>
    </div>
  </div>
</div>

<script>
document.getElementById('loginForm').addEventListener('submit', function() {
  const btn = document.getElementById('loginBtn');
  btn.textContent = 'Signing in…';
  btn.style.opacity = '.7';
});
</script>
</body>
</html>
