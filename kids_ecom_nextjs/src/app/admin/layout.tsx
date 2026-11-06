'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/admin/Sidebar';
import Topbar from '@/components/admin/Topbar';
import { ToastProvider } from '@/components/admin/Toast';
import { API_BASE_URL } from '@/utils/api';

import '../../../public/admin/assets/admin.css';

const PAGE_TITLES: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/products': 'Products',
  '/admin/orders': 'Orders',
  '/admin/customers': 'Customers',
  '/admin/analytics': 'Analytics',
  '/admin/settings': 'Settings',
  '/admin/coupons': 'Coupons',
  '/admin/media': 'Media Library',
  '/admin/categories': 'Categories',
  '/admin/email-settings': 'Email Configuration',
  '/admin/email-templates': 'Email Templates',
  '/admin/email-logs': 'Email Logs'
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const validateToken = async () => {
      if (pathname === '/admin/login') {
        setIsAuthChecking(false);
        return;
      }

      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.replace('/admin/login');
        return;
      }

      try {
        const baseUrl = API_BASE_URL;
        const res = await fetch(`${baseUrl}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (res.ok) {
          setIsAuthChecking(false);
        } else {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminUser');
          router.replace('/admin/login');
        }
      } catch (err) {
        // Fallback if backend is down, maybe kick out or allow based on strictness.
        // Usually, kick out.
        localStorage.removeItem('adminToken');
        router.replace('/admin/login');
      }
    };

    validateToken();
    // Basic theme switcher logic porting
    const applyTheme = (theme: string) => {
      document.documentElement.dataset.theme = theme === 'gold' ? '' : theme;
      document.querySelectorAll('.theme-dot').forEach(d => {
        d.classList.toggle('active', (d as HTMLElement).dataset.t === theme);
      });
      localStorage.setItem('admin_theme', theme);
    };

    const savedTheme = localStorage.getItem('admin_theme') || 'gold';
    applyTheme(savedTheme);

    const handleThemeClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('theme-dot')) {
        const t = target.dataset.t;
        if (t) applyTheme(t);
      }
    };

    const handleOutsideClick = (e: MouseEvent) => {
      // Close dropdowns if click is outside
      const target = e.target as HTMLElement;
      if (!target.closest('.status-dropdown') && !target.closest('.topbar-user') && !target.closest('.topbar-icon-btn')) {
        document.querySelectorAll('.dropdown-menu.open').forEach(el => {
          el.classList.remove('open');
          // For inline styles managed by React state, we'll let React handle it where possible,
          // but for vanilla DOM nodes (like custom status drops), this removes the open class.
        });
      }
    };

    document.addEventListener('click', handleThemeClick);
    document.addEventListener('click', handleOutsideClick);
    return () => {
      document.removeEventListener('click', handleThemeClick);
      document.removeEventListener('click', handleOutsideClick);
    };
  }, []);

  const title = PAGE_TITLES[pathname] || 'Dashboard';

  if (pathname === '/admin/login') {
    return (
      <ToastProvider>
        {children}
      </ToastProvider>
    );
  }

  if (isAuthChecking) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100%', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-card)' }}>
        <div style={{ color: 'var(--primary)', fontSize: '18px', fontWeight: 'bold' }}>Authenticating...</div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="admin-wrapper">
        <Sidebar isOpen={sidebarOpen} />
        
        <div className={`admin-main ${!sidebarOpen ? 'expanded' : ''}`} id="adminMain">
          <Topbar 
            title={title}
            toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
          />
          
          <main className="admin-content">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
