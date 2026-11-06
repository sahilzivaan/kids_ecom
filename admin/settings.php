<?php
require_once 'includes/auth.php';
require_once __DIR__ . '/includes/razorpay_config.php';
$pageTitle  = 'Settings';
$pageTitle  = 'Settings';
$activePage = 'settings';
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚙️</text></svg>">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Settings — Chhotu Fashion Admin</title>
  <link rel="stylesheet" href="assets/admin.css?v=<?= filemtime('assets/admin.css') ?>">
</head>
<body>
<div class="admin-wrapper">
  <?php include 'includes/sidebar.php'; ?>
  <div class="admin-main" id="adminMain">
    <?php include 'includes/topbar.php'; ?>
    <main class="admin-content">

      <div class="sec-hdr" style="margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
        <div>
          <div class="sec-title" style="font-family:'Outfit',sans-serif;font-size:24px;font-weight:700">Store Settings</div>
          <div class="sec-sub">Configure payment gateways, store profile, shipping policies, notifications, and tax rules.</div>
        </div>
        <div style="display:flex;align-items:center;gap:12px">
          <div id="lastSaved" style="font-size:12px;color:var(--muted)"></div>
          <button class="btn btn-gold btn-sm" onclick="saveAllSettings()" style="display:flex;align-items:center;gap:6px">
            <span>💾</span>
            <span>Save All</span>
          </button>
        </div>
      </div>

      <div class="admin-card" style="padding:0;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.3)">
        <!-- Settings Tabs Header -->
        <div class="settings-tabs">
          <button class="stab active" data-tab="payments">
            <span>💳</span>
            <span>Payments</span>
            <span class="badge" style="background:var(--gold-dim);color:var(--gold);font-size:10px;padding:1px 6px">Active</span>
          </button>
          <button class="stab" data-tab="general">
            <span>⚙️</span>
            <span>General</span>
          </button>
          <button class="stab" data-tab="shipping">
            <span>🚚</span>
            <span>Shipping</span>
          </button>
          <button class="stab" data-tab="notifications">
            <span>🔔</span>
            <span>Notifications</span>
          </button>
          <button class="stab" data-tab="tax">
            <span>🧾</span>
            <span>Tax & Invoicing</span>
          </button>
          <button class="stab" data-tab="admin">
            <span>🔐</span>
            <span>Admin Account</span>
          </button>
        </div>

        <!-- ════════════════════════════════════════════════════════════════════════
            PAYMENTS TAB (FEATURED)
            ════════════════════════════════════════════════════════════════════════ -->
        <div id="tab-payments" class="stab-content active">
          
          <!-- Summary Banner -->
          <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;background:linear-gradient(135deg,rgba(201,168,76,0.12) 0%,rgba(26,22,70,0.4) 100%);border:1px solid var(--gold-border);border-radius:var(--r-sm);margin-bottom:24px;flex-wrap:wrap;gap:12px">
            <div>
              <div style="font-size:14px;font-weight:600;color:var(--platinum);display:flex;align-items:center;gap:8px">
                <span>🛡️ PCI-DSS Compliant Payment Infrastructure</span>
                <span class="badge b-gold" style="font-size:10px">Active System</span>
              </div>
              <p style="font-size:12px;color:var(--muted);margin-top:2px">
                Seamless checkout supporting UPI, Credit/Debit Cards, Net Banking, and Cash on Delivery.
              </p>
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              <span class="method-tag">⚡ UPI Intent</span>
              <span class="method-tag">💳 Cards</span>
              <span class="method-tag">🏦 Net Banking</span>
              <span class="method-tag">💵 COD</span>
            </div>
          </div>

          <!-- Razorpay Card -->
          <div class="gateway-card active-gateway" id="rzpCard">
            <div class="gateway-card-header">
              <div class="gateway-brand">
                <div class="gateway-icon" style="background:rgba(51,149,255,0.12);border-color:rgba(51,149,255,0.3)">
                  <span>⚡</span>
                </div>
                <div class="gateway-title-wrap">
                  <h4>
                    Razorpay Integration
                    <span class="env-badge live" id="rzpModeBadge">● Live</span>
                  </h4>
                  <p>Accept instant UPI (GPay, PhonePe, Paytm), Cards (Visa/Mastercard/RuPay), and Net Banking across 50+ banks.</p>
                </div>
              </div>
              <div class="gateway-actions">
                <label class="toggle-sw">
                  <input type="checkbox" checked id="togRazorpay">
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div class="gateway-config-body">
              <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:rgba(0,0,0,0.25);border-radius:8px;border:1px solid var(--glass-b);margin-bottom:18px">
                <div>
                  <div style="font-size:13px;font-weight:600;color:var(--platinum)">Environment Mode</div>
                  <div style="font-size:12px;color:var(--muted)">Switch to Live mode once you verify test payments.</div>
                </div>
                <div style="display:flex;gap:4px;background:rgba(0,0,0,0.3);padding:3px;border-radius:8px;border:1px solid var(--glass-b)">
                  <button type="button" class="s-tab" id="btnRzpTest" onclick="setRzpMode('test')" style="font-size:12px;padding:4px 12px">🟡 Sandbox / Test</button>
                  <button type="button" class="s-tab active" id="btnRzpLive" onclick="setRzpMode('live')" style="font-size:12px;padding:4px 12px">🟢 Production / Live</button>
                </div>
              </div>

              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Razorpay Key ID</label>
                  <div class="copy-input-wrap">
                    <input type="text" class="form-control" value="<?= htmlspecialchars(defined('RAZORPAY_KEY_ID') ? RAZORPAY_KEY_ID : '') ?>" id="rzpKey">
                    <button type="button" class="copy-btn" onclick="copyText(document.getElementById('rzpKey').value, this)">Copy</button>
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Razorpay Key Secret</label>
                  <div style="position:relative">
                    <input type="password" class="form-control" value="<?= htmlspecialchars(defined('RAZORPAY_KEY_SECRET') ? RAZORPAY_KEY_SECRET : '') ?>" id="rzpSecret" style="padding-right:40px">
                    <button type="button" onclick="togglePass('rzpSecret', this)" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);color:var(--muted);background:none;border:none;cursor:pointer">🔒</button>
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Webhook Secret</label>
                  <input type="password" class="form-control" value="whsec_9876543210abcdef" id="rzpWebhook">
                </div>

                <div class="form-group">
                  <label class="form-label">Webhook Endpoint URL</label>
                  <div class="copy-input-wrap">
                    <input type="text" readonly class="form-control" value="https://api.chhotufashion.in/api/webhooks/razorpay">
                    <button type="button" class="copy-btn" onclick="copyText('https://api.chhotufashion.in/api/webhooks/razorpay', this)">Copy URL</button>
                  </div>
                </div>

                <div class="form-group full" style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:rgba(0,0,0,0.18);border-radius:8px;border:1px solid var(--glass-b)">
                  <div>
                    <div style="font-size:13px;font-weight:600;color:var(--platinum)">Auto-Capture Authorized Payments</div>
                    <div style="font-size:12px;color:var(--muted)">Automatically capture payments instantly upon customer authorization.</div>
                  </div>
                  <label class="toggle-sw">
                    <input type="checkbox" checked id="togAutoCapture">
                    <span class="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- Cash on Delivery (COD) Card -->
          <div class="gateway-card active-gateway" id="codCard">
            <div class="gateway-card-header">
              <div class="gateway-brand">
                <div class="gateway-icon" style="background:rgba(16,185,129,0.12);border-color:rgba(16,185,129,0.3)">
                  <span>💵</span>
                </div>
                <div class="gateway-title-wrap">
                  <h4>
                    Cash on Delivery (COD)
                    <span class="env-badge live">● Active</span>
                  </h4>
                  <p>Allow customers to pay in cash or via delivery partner UPI QR code upon delivery.</p>
                </div>
              </div>
              <div class="gateway-actions">
                <label class="toggle-sw">
                  <input type="checkbox" checked id="togCod">
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div class="gateway-config-body">
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Extra COD Handling Fee (₹)</label>
                  <input type="number" class="form-control" value="0" id="codFee" min="0" placeholder="0 (Free)">
                  <span style="font-size:11px;color:var(--muted)">Set ₹0 for free COD or ₹29–₹49 for convenience handling.</span>
                </div>

                <div class="form-group">
                  <label class="form-label">Minimum Order Value for COD (₹)</label>
                  <input type="number" class="form-control" value="199" id="codMin">
                </div>

                <div class="form-group">
                  <label class="form-label">Maximum Order Limit for COD (₹)</label>
                  <input type="number" class="form-control" value="5000" id="codMax">
                </div>

                <div class="form-group full" style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:rgba(0,0,0,0.18);border-radius:8px;border:1px solid var(--glass-b)">
                  <div>
                    <div style="font-size:13px;font-weight:600;color:var(--platinum);display:flex;align-items:center;gap:6px">
                      <span>📱 Require SMS OTP Verification on Checkout</span>
                      <span class="badge" style="background:rgba(16,185,129,0.15);color:#34D399;font-size:9px">Recommended</span>
                    </div>
                    <div style="font-size:12px;color:var(--muted)">Prevents fake COD orders and minimizes Return to Origin (RTO) rates.</div>
                  </div>
                  <label class="toggle-sw">
                    <input type="checkbox" checked id="togCodOtp">
                    <span class="toggle-slider"></span>
                  </label>
                </div>

                <div class="form-group full">
                  <label class="form-label">Doorstep Instructions (Shown at Checkout)</label>
                  <textarea class="form-control" rows="2" id="codInstructions">Please keep exact cash ready or scan the delivery partner QR code upon arrival.</textarea>
                </div>
              </div>
            </div>
          </div>

          <!-- PhonePe Gateway Card -->
          <div class="gateway-card">
            <div class="gateway-card-header">
              <div class="gateway-brand">
                <div class="gateway-icon" style="background:rgba(103,58,183,0.15);border-color:rgba(103,58,183,0.3)">
                  <span>📱</span>
                </div>
                <div class="gateway-title-wrap">
                  <h4>
                    PhonePe Payment Gateway
                    <span class="env-badge test">○ Sandbox</span>
                  </h4>
                  <p>Direct PhonePe UPI intent flow for 1-click checkout on mobile devices.</p>
                </div>
              </div>
              <div class="gateway-actions">
                <label class="toggle-sw">
                  <input type="checkbox" id="togPhonePe">
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>

        </div>

        <!-- ════════════════════════════════════════════════════════════════════════
            GENERAL TAB
            ════════════════════════════════════════════════════════════════════════ -->
        <div id="tab-general" class="stab-content">
          
          <div class="settings-section-card">
            <div class="settings-section-title">
              <span>🏪</span>
              <span>Store Brand Identity</span>
            </div>
            <div class="settings-section-desc">Public store name, branding slogans, and logo links.</div>

            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">Store Name</label>
                <input type="text" class="form-control" value="Chhotu Fashion" id="storeName">
              </div>
              <div class="form-group">
                <label class="form-label">Tagline</label>
                <input type="text" class="form-control" value="India's Most Loved Kids Clothing Brand" id="tagline">
              </div>
              <div class="form-group">
                <label class="form-label">Support Email</label>
                <input type="email" class="form-control" value="support@chhotufashion.in" id="email">
              </div>
              <div class="form-group">
                <label class="form-label">Phone Helpline</label>
                <input type="tel" class="form-control" value="+91 1800-123-4567" id="phone">
              </div>
              <div class="form-group">
                <label class="form-label">Currency</label>
                <select class="form-control" id="currency">
                  <option selected>INR (₹) - Indian Rupee</option>
                  <option>USD ($) - US Dollar</option>
                  <option>EUR (€) - Euro</option>
                  <option>GBP (£) - British Pound</option>
                  <option>AED (د.إ) - UAE Dirham</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">System Timezone</label>
                <select class="form-control" id="timezone">
                  <option selected>Asia/Kolkata (IST +5:30)</option>
                  <option>Asia/Dubai (GST +4:00)</option>
                  <option>UTC (Coordinated Universal Time)</option>
                  <option>America/New_York (EST -5:00)</option>
                  <option>Europe/London (GMT +0:00)</option>
                </select>
              </div>
              <div class="form-group full">
                <label class="form-label">Store Registered Address</label>
                <textarea class="form-control" rows="2" id="address">204, Fashion Hub, Linking Road, Bandra West, Mumbai, Maharashtra 400050</textarea>
              </div>
            </div>
          </div>

          <div class="settings-section-card">
            <div class="settings-section-title">
              <span>🛑</span>
              <span>Store Operations Mode</span>
            </div>
            <div class="form-grid g1">
              <div class="toggle-row">
                <div class="toggle-info">
                  <h4>Accepting New Orders</h4>
                  <p>When turned off, checkout will be paused temporarily.</p>
                </div>
                <label class="toggle-sw"><input type="checkbox" checked id="togOrders"><span class="toggle-slider"></span></label>
              </div>
              <div class="toggle-row">
                <div class="toggle-info">
                  <h4>Maintenance Mode</h4>
                  <p>Display a maintenance screen to customers while keeping admin panel accessible.</p>
                </div>
                <label class="toggle-sw"><input type="checkbox" id="togMaint"><span class="toggle-slider"></span></label>
              </div>
            </div>
          </div>

        </div>

        <!-- ════════════════════════════════════════════════════════════════════════
            SHIPPING TAB
            ════════════════════════════════════════════════════════════════════════ -->
        <div id="tab-shipping" class="stab-content">
          <div class="settings-section-card">
            <div class="settings-section-title">
              <span>🚚</span>
              <span>Delivery Charges & Free Shipping</span>
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">Standard Delivery Charge (₹)</label>
                <input type="number" class="form-control" value="49" id="stdCharge">
              </div>
              <div class="form-group">
                <label class="form-label">Free Shipping Threshold (₹)</label>
                <input type="number" class="form-control" value="499" id="freeShip">
              </div>
              <div class="form-group">
                <label class="form-label">Express Delivery Charge (₹)</label>
                <input type="number" class="form-control" value="99" id="expCharge">
              </div>
              <div class="form-group">
                <label class="form-label">Standard Delivery SLA</label>
                <input type="text" class="form-control" value="3–5 Business Days" id="stdTime">
              </div>
              <div class="form-group">
                <label class="form-label">Return & Replacement Window</label>
                <select class="form-control" id="returnWindow">
                  <option selected>7 Days Hassle-Free Return / Exchange</option>
                  <option>10 Days Return Window</option>
                  <option>14 Days Extended Returns</option>
                  <option>30 Days Premium Return Policy</option>
                  <option>No Returns</option>
                </select>
              </div>
              <div class="form-group full">
                <label class="form-label">Shipping Serviceable Zones</label>
                <textarea class="form-control" rows="2" id="zones">Maharashtra, Delhi NCR, Karnataka, Tamil Nadu, Gujarat, Rajasthan, West Bengal, Telangana, Kerala</textarea>
              </div>
            </div>
          </div>
        </div>

        <!-- ════════════════════════════════════════════════════════════════════════
            NOTIFICATIONS TAB
            ════════════════════════════════════════════════════════════════════════ -->
        <div id="tab-notifications" class="stab-content">
          <div class="settings-section-card">
            <div class="settings-section-title">
              <span>👤</span>
              <span>Customer Automated Messages</span>
            </div>
            <div class="form-grid g1">
              <div class="toggle-row">
                <div class="toggle-info"><h4>📧 Order Confirmation Email</h4><p>Send an immediate email receipt upon order placement.</p></div>
                <label class="toggle-sw"><input type="checkbox" checked id="togOrderEmail"><span class="toggle-slider"></span></label>
              </div>
              <div class="toggle-row">
                <div class="toggle-info"><h4>📱 Order Tracking SMS & WhatsApp</h4><p>Send dispatch updates with tracking link.</p></div>
                <label class="toggle-sw"><input type="checkbox" checked id="togOrderSms"><span class="toggle-slider"></span></label>
              </div>
            </div>
          </div>

          <div class="settings-section-card">
            <div class="settings-section-title">
              <span>🚨</span>
              <span>Admin Real-Time Store Alerts</span>
            </div>
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">Admin Alert Email</label>
                <input type="email" class="form-control" value="admin@chhotufashion.in" id="adminAlertEmail">
              </div>
              <div class="form-group">
                <label class="form-label">Admin SMS / WhatsApp Phone</label>
                <input type="tel" class="form-control" value="+91 98765 43210" id="adminAlertPhone">
              </div>
              <div class="form-group">
                <label class="form-label">Low Inventory Stock Warning Threshold</label>
                <input type="number" class="form-control" value="5" id="lowStockThreshold">
              </div>
            </div>
          </div>
        </div>

        <!-- ════════════════════════════════════════════════════════════════════════
            TAX & INVOICING TAB
            ════════════════════════════════════════════════════════════════════════ -->
        <div id="tab-tax" class="stab-content">
          <div class="settings-section-card">
            <div class="settings-section-title">
              <span>🧾</span>
              <span>GST Compliance & Invoicing</span>
            </div>
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">GSTIN (GST Identification Number)</label>
                <input type="text" class="form-control" value="27AABCC1234D1Z5" id="gst">
              </div>
              <div class="form-group">
                <label class="form-label">Standard GST Tax Slab</label>
                <select class="form-control" id="gstSlab">
                  <option>5% (Essential Kids Apparel < ₹1,000)</option>
                  <option>12% (Apparel & Footwear > ₹1,000)</option>
                  <option selected>18% (Standard GST Slab)</option>
                  <option>0% (Exempt)</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Invoice Prefix</label>
                <input type="text" class="form-control" value="CF-2026-" id="invPrefix">
              </div>
              <div class="form-group">
                <label class="form-label">Next Invoice Sequence Number</label>
                <input type="number" class="form-control" value="1001" id="invNum">
              </div>
              <div class="form-group full">
                <label class="form-label">Invoice Footer Return Policy / Notes</label>
                <textarea class="form-control" rows="2" id="invFooter">Thank you for choosing Chhotu Fashion! For queries and exchanges, reach us at support@chhotufashion.in</textarea>
              </div>
            </div>
          </div>
        </div>

        <!-- ════════════════════════════════════════════════════════════════════════
            ADMIN ACCOUNT TAB
            ════════════════════════════════════════════════════════════════════════ -->
        <div id="tab-admin" class="stab-content">
          <div class="settings-section-card">
            <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
              <div class="cp-avatar" style="width:54px;height:54px;border-radius:50%;background:linear-gradient(135deg,var(--gold) 0%,#B8860B 100%);color:var(--navy);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700">
                <?= strtoupper(substr($admin_name,0,1)) ?>
              </div>
              <div>
                <div style="font-size:16px;font-weight:600;color:var(--platinum)"><?= htmlspecialchars($admin_name) ?></div>
                <div style="font-size:13px;color:var(--muted)">admin@chhotufashion.in</div>
                <span class="badge b-gold" style="margin-top:4px">Super Administrator</span>
              </div>
            </div>
          </div>

          <div class="settings-section-card">
            <div class="settings-section-title">
              <span>👤</span>
              <span>Admin Details</span>
            </div>
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">Full Name</label>
                <input type="text" class="form-control" value="<?= htmlspecialchars($admin_name) ?>" id="adminName">
              </div>
              <div class="form-group">
                <label class="form-label">Login Email</label>
                <input type="email" class="form-control" value="admin@chhotufashion.in" id="adminEmail">
              </div>
              <div class="form-group">
                <label class="form-label">Session Inactivity Timeout</label>
                <select class="form-control" id="adminTimeout">
                  <option>1 Hour (High Security)</option>
                  <option>4 Hours</option>
                  <option selected>24 Hours</option>
                  <option>7 Days (Remember Me)</option>
                </select>
              </div>
            </div>
          </div>

          <div class="settings-section-card">
            <div class="settings-section-title">
              <span>🔒</span>
              <span>Change Password</span>
            </div>
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">Current Password</label>
                <input type="password" class="form-control" placeholder="Enter current password" id="curPass">
              </div>
              <div class="form-group">
                <label class="form-label">New Password</label>
                <input type="password" class="form-control" placeholder="Enter new password" id="newPass">
              </div>
              <div class="form-group">
                <label class="form-label">Confirm New Password</label>
                <input type="password" class="form-control" placeholder="Confirm new password" id="confPass">
              </div>
            </div>
          </div>
        </div>

        <!-- ════════════════════════════════════════════════════════════════════════
            BOTTOM ACTION BAR
            ════════════════════════════════════════════════════════════════════════ -->
        <div class="settings-action-bar">
          <div style="font-size:13px;color:var(--muted)" id="bottomStatus">
            All settings are synchronized with database.
          </div>
          <div style="display:flex;align-items:center;gap:10px">
            <button type="button" class="btn btn-ghost" onclick="location.reload()">Reset</button>
            <button type="button" class="btn btn-gold" onclick="saveAllSettings()" style="display:flex;align-items:center;gap:6px;min-width:140px;justify-content:center">
              <span>💾</span>
              <span>Save Settings</span>
            </button>
          </div>
        </div>

      </div><!-- /admin-card -->
    </main>
  </div>
</div>

<script src="assets/admin.js?v=<?= filemtime('assets/admin.js') ?>"></script>
<script>
// Tab Switching
document.querySelectorAll('.stab').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.stab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.stab-content').forEach(c => c.classList.remove('active'));
    this.classList.add('active');
    const target = document.getElementById('tab-' + this.dataset.tab);
    if (target) target.classList.add('active');
  });
});

// Environment toggle
function setRzpMode(mode) {
  const isLive = mode === 'live';
  document.getElementById('btnRzpLive').classList.toggle('active', isLive);
  document.getElementById('btnRzpTest').classList.toggle('active', !isLive);
  const badge = document.getElementById('rzpModeBadge');
  if (badge) {
    badge.className = isLive ? 'env-badge live' : 'env-badge test';
    badge.textContent = isLive ? '● Live' : '○ Test Mode';
  }
}

// Copy to clipboard
function copyText(text, btn) {
  navigator.clipboard.writeText(text);
  const orig = btn.textContent;
  btn.textContent = '✓ Copied';
  setTimeout(() => btn.textContent = orig, 1800);
}

// Show/hide password
function togglePass(id, btn) {
  const el = document.getElementById(id);
  if (el.type === 'password') {
    el.type = 'text';
    btn.textContent = '👁️';
  } else {
    el.type = 'password';
    btn.textContent = '🔒';
  }
}

// Save All Settings
async function saveAllSettings() {
  const np = document.getElementById('newPass') ? document.getElementById('newPass').value : '';
  const cp = document.getElementById('confPass') ? document.getElementById('confPass').value : '';
  if (np && np !== cp) {
    showToast('❌ New passwords do not match!', 'error');
    return;
  }

  // Get Razorpay Keys
  const key_id = document.getElementById('rzpKey') ? document.getElementById('rzpKey').value : '';
  const key_secret = document.getElementById('rzpSecret') ? document.getElementById('rzpSecret').value : '';

  try {
      const response = await fetch('api/save_razorpay_settings.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key_id, key_secret })
      });
      const data = await response.json();
      
      if (!response.ok) {
          showToast('❌ ' + (data.error || 'Failed to save settings'), 'error');
          return;
      }
      
      const now = new Date().toLocaleString('en-IN', {hour:'2-digit',minute:'2-digit'});
      document.getElementById('lastSaved').textContent = 'Last saved: ' + now;
      document.getElementById('bottomStatus').innerHTML = `✓ Settings saved at <span style="color:var(--platinum)">${now}</span>`;
      showToast('💾 Settings saved successfully!', 'success');
  } catch (err) {
      showToast('❌ Network error while saving settings', 'error');
  }
}
</script>
</body>
</html>
