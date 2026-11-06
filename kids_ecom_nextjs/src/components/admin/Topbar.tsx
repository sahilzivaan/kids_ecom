'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Swal from 'sweetalert2';
import { API_BASE_URL } from '@/utils/api';

export default function Topbar({ 
  toggleSidebar, 
  title = 'Dashboard' 
}: { 
  toggleSidebar: () => void, 
  title?: string 
}) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([
    { id: 1, text: '📦 New order #CF1102', isNew: true },
    { id: 2, text: '💬 Customer review received', isNew: true },
    { id: 3, text: '⚠️ Low stock: Boys Kurta Set', isNew: true },
  ]);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) return;
        const baseUrl = API_BASE_URL;
        const res = await fetch(`${baseUrl}/admin/notifications`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          if (json.notifications) setNotifications(json.notifications);
        }
      } catch (err) {
        // Silent fail for polling
      }
    };
    
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 60000); // 60s polling
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => n.isNew).length;

  return (
    <>
      <header className="admin-topbar">
        <button 
          className="sidebar-toggle" 
          onClick={toggleSidebar} 
          aria-label="Toggle sidebar"
        >
          ☰
        </button>

        <div className="topbar-breadcrumb">
          <h2>{title}</h2>
          <p className="bread-sub">Chhotu Fashion &rsaquo; Admin &rsaquo; {title}</p>
        </div>

        <div className="topbar-actions">
          {/* Global Search Trigger */}
          <button 
            className="search-trigger" 
            title="Global Search (Ctrl+K)" 
            onClick={() => {
              if (typeof window !== 'undefined' && (window as any).openGS) {
                (window as any).openGS();
              }
            }}
          >
            🔍 <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Search…</span>
            <span className="search-trigger-kbd">Ctrl K</span>
          </button>

          <div className="topbar-divider"></div>

          {/* Theme Switcher */}
          <div className="theme-switcher" title="Switch colour theme">
            <span className="theme-switcher-label">🎨</span>
            <div className="theme-dot active" data-t="gold" title="Royal Gold"></div>
            <div className="theme-dot" data-t="violet" title="Midnight Violet"></div>
            <div className="theme-dot" data-t="emerald" title="Emerald Elite"></div>
            <div className="theme-dot" data-t="sapphire" title="Sapphire Pro"></div>
            <div className="theme-dot" data-t="onyx" title="Pure Onyx"></div>
          </div>

          <div className="topbar-divider"></div>

          {/* Notifications */}
          <div style={{ position: 'relative' }}>
            <button 
              className="topbar-icon-btn" 
              onClick={() => {
                setNotifOpen(!notifOpen);
                if (!notifOpen) {
                  setNotifications(prev => prev.map(n => ({ ...n, isNew: false })));
                }
              }} 
              title="Notifications"
            >
              🔔{unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
            </button>
            <div className={`dropdown-menu ${notifOpen ? 'open' : ''}`} style={{ display: notifOpen ? 'block' : 'none' }}>
              {notifications.length > 0 ? notifications.map(n => (
                <div key={n.id} className="dropdown-item">{n.text}</div>
              )) : (
                <div className="dropdown-item" style={{ color: 'var(--muted)' }}>No new notifications</div>
              )}
              <div className="dropdown-divider"></div>
              <div className="dropdown-item" style={{ color: 'var(--muted)', fontSize: '12px', textAlign: 'center' }}>
                End of recent notifications
              </div>
            </div>
          </div>

          {/* User menu */}
          <div className="topbar-user" style={{ position: 'relative' }} onClick={() => setUserMenuOpen(!userMenuOpen)}>
            <div className="profile-avatar">A</div>
            <span className="u-name">Admin User</span>
            <span style={{ color: 'var(--muted)', fontSize: '11px' }}>▾</span>
            <div className={`dropdown-menu ${userMenuOpen ? 'open' : ''}`} style={{ display: userMenuOpen ? 'block' : 'none' }}>
              <Link href="/admin/settings" className="dropdown-item">⚙️ Settings</Link>
              <div className="dropdown-divider"></div>
              <button 
                className="dropdown-item danger" 
                onClick={() => {
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
                      window.location.href = '/admin/login';
                    }
                  });
                }}
                style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Global Search Overlay (shared across all pages) */}
      <div className="gs-overlay" id="gsOverlay">
        <div className="gs-box">
          <div className="gs-input-row">
            <span className="gs-ico">🔍</span>
            <input type="text" className="gs-input" id="gsInput" placeholder="Search pages, features…" autoComplete="off" />
            <button className="gs-esc" onClick={() => {
              if (typeof window !== 'undefined' && (window as any).closeGS) {
                (window as any).closeGS();
              }
            }}>ESC</button>
          </div>
          <div className="gs-results" id="gsResults"></div>
          <div className="gs-footer">
            <span><kbd>↑↓</kbd> Navigate</span>
            <span><kbd>↵</kbd> Open</span>
            <span><kbd>Esc</kbd> Close</span>
            <span><kbd>Ctrl K</kbd> Toggle</span>
          </div>
        </div>
      </div>
    </>
  );
}
