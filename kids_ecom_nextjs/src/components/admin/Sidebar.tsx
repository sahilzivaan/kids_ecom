'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

export default function Sidebar({ isOpen }: { isOpen: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  // Auto-open the email group if currently on an email page
  const emailPaths = ['/admin/email-settings', '/admin/email-templates', '/admin/email-logs'];
  const [emailGroupOpen, setEmailGroupOpen] = useState(
    emailPaths.some(p => pathname.startsWith(p))
  );

  const isActive = (path: string) => {
    if (path === '/admin') return pathname === '/admin' ? 'active' : '';
    return pathname.startsWith(path) ? 'active' : '';
  };

  const isEmailActive = emailPaths.some(p => pathname.startsWith(p));

  const handleLogout = () => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You will be logged out of the admin panel.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'var(--gold)',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, logout!'
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        router.push('/admin/login');
      }
    });
  };

  return (
    <aside className={`admin-sidebar ${!isOpen ? 'collapsed' : ''}`} id="adminSidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">👗</div>
        <div className="logo-text">
          <span className="brand">Chhotu Fashion</span>
          <span className="sub">Admin Panel</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Main Menu</div>

        <Link href="/admin" className={`nav-item ${isActive('/admin')}`} data-tooltip="Dashboard">
          <span className="nav-icon">📊</span>
          <span className="nav-label">Dashboard</span>
        </Link>

        <Link href="/admin/products" className={`nav-item ${isActive('/admin/products')}`} data-tooltip="Products">
          <span className="nav-icon">👗</span>
          <span className="nav-label">Products</span>
        </Link>

        <Link href="/admin/media" className={`nav-item ${isActive('/admin/media')}`} data-tooltip="Media Library">
          <span className="nav-icon">🖼️</span>
          <span className="nav-label">Media Library</span>
        </Link>

        <Link href="/admin/orders" className={`nav-item ${isActive('/admin/orders')}`} data-tooltip="Orders">
          <span className="nav-icon">📦</span>
          <span className="nav-label">Orders</span>
        </Link>

        <Link href="/admin/customers" className={`nav-item ${isActive('/admin/customers')}`} data-tooltip="Customers">
          <span className="nav-icon">👥</span>
          <span className="nav-label">Customers</span>
        </Link>

        <div className="nav-section-label">Analytics &amp; Reports</div>

        <Link href="/admin/analytics" className={`nav-item ${isActive('/admin/analytics')}`} data-tooltip="Analytics">
          <span className="nav-icon">📈</span>
          <span className="nav-label">Analytics</span>
        </Link>

        <div className="nav-section-label">Configuration</div>

        <Link href="/admin/categories" className={`nav-item ${isActive('/admin/categories')}`} data-tooltip="Categories">
          <span className="nav-icon">🏷️</span>
          <span className="nav-label">Categories</span>
        </Link>

        <Link href="/admin/coupons" className={`nav-item ${isActive('/admin/coupons')}`} data-tooltip="Coupons">
          <span className="nav-icon">🎟️</span>
          <span className="nav-label">Coupons</span>
        </Link>

        {/* ── Email Group ── */}
        <div
          className={`nav-group-header ${isEmailActive ? 'active' : ''}`}
          onClick={() => setEmailGroupOpen(o => !o)}
          data-tooltip="Email Center"
          role="button"
          aria-expanded={emailGroupOpen}
        >
          <span className="nav-icon">📧</span>
          <span className="nav-label">Email Center</span>
          <span className={`nav-group-arrow ${emailGroupOpen ? 'open' : ''}`}>‹</span>
        </div>

        <div className={`nav-group-body ${emailGroupOpen ? 'open' : ''}`}>
          <Link href="/admin/email-settings" className={`nav-item nav-sub-item ${isActive('/admin/email-settings')}`} data-tooltip="Email Settings">
            <span className="nav-icon">⚙️</span>
            <span className="nav-label">Settings</span>
          </Link>
          <Link href="/admin/email-templates" className={`nav-item nav-sub-item ${isActive('/admin/email-templates')}`} data-tooltip="Email Templates">
            <span className="nav-icon">📝</span>
            <span className="nav-label">Templates</span>
          </Link>
          <Link href="/admin/email-logs" className={`nav-item nav-sub-item ${isActive('/admin/email-logs')}`} data-tooltip="Email Logs">
            <span className="nav-icon">📜</span>
            <span className="nav-label">Logs</span>
          </Link>
        </div>

        <Link href="/admin/settings" className={`nav-item ${isActive('/admin/settings')}`} data-tooltip="Settings">
          <span className="nav-icon">⚙️</span>
          <span className="nav-label">Settings</span>
        </Link>
      </nav>

      <div className="sidebar-footer">
        <div className="admin-profile">
          <div className="profile-avatar">A</div>
          <div className="profile-info">
            <span className="profile-name">Admin User</span>
            <span className="profile-role">Super Admin</span>
          </div>
        </div>
        <button onClick={handleLogout} className="btn-logout" title="Logout">
          <span>🚪</span> <span className="logout-text">Logout</span>
        </button>
      </div>
    </aside>
  );
}
