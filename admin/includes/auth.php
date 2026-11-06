<?php
if (session_status() === PHP_SESSION_NONE) session_start();

define('ADMIN_USER', 'admin');
define('ADMIN_PASS', 'admin123');

// Handle logout
if (isset($_GET['logout'])) {
    session_destroy();
    header('Location: index.php');
    exit;
}

// Handle login submission (only from login page)
if (defined('IS_LOGIN_PAGE') && $_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['login_action'])) {
    if ($_POST['username'] === ADMIN_USER && $_POST['password'] === ADMIN_PASS) {
        $_SESSION['admin_logged_in'] = true;
        $_SESSION['admin_name']      = 'Super Admin';
        header('Location: dashboard.php');
        exit;
    } else {
        $login_error = true;
    }
}

// Auth guard — skip only on login page
if (!defined('IS_LOGIN_PAGE')) {
    if (empty($_SESSION['admin_logged_in'])) {
        header('Location: index.php');
        exit;
    }
}

$admin_name = $_SESSION['admin_name'] ?? 'Admin';
