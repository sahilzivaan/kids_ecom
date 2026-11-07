'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { fetchCustomerAuth } from '@/utils/api';
import Swal from 'sweetalert2';

export default function Header() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const isCheckout = pathname === '/checkout';

  useEffect(() => {
    const refreshCounts = () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      setIsLoggedIn(!!token);
      
      if (token) {
        fetchCustomerAuth('/cart')
          .then(res => res.json())
          .then(data => {
            if (data.cart) {
              setCartCount(data.cart.length);
            } else {
              setCartCount(0);
            }
          })
          .catch(() => setCartCount(0));

        fetchCustomerAuth('/wishlist')
          .then(res => res.json())
          .then(data => {
            if (data.products) {
              setWishlistCount(data.products.length);
            } else {
              setWishlistCount(0);
            }
          })
          .catch(() => setWishlistCount(0));
      } else {
        setCartCount(0);
        setWishlistCount(0);
      }
    };

    refreshCounts();

    const handleCartUpdate = () => {
      refreshCounts();
    };
    
    const handleWishlistUpdate = () => {
      refreshCounts();
    };

    window.addEventListener('cart_updated', handleCartUpdate);
    window.addEventListener('wishlist_updated', handleWishlistUpdate);
    window.addEventListener('storage', refreshCounts);
    
    return () => {
      window.removeEventListener('cart_updated', handleCartUpdate);
      window.removeEventListener('wishlist_updated', handleWishlistUpdate);
      window.removeEventListener('storage', refreshCounts);
    };
  }, [pathname]);

  const handleLogout = () => {
    Swal.fire({
      title: '<span style="font-family: var(--font-serif); font-size: 28px; color: var(--text-heading); font-weight: 700;">Leaving so soon?</span>',
      html: '<p style="color: var(--text-body); font-size: 15.5px; margin-top: 4px;">Are you sure you want to log out of your account?</p>',
      icon: 'question',
      iconColor: 'var(--primary)',
      showCancelButton: true,
      confirmButtonColor: 'var(--primary)',
      cancelButtonColor: 'var(--bg-subtle)',
      confirmButtonText: 'Yes, Logout',
      cancelButtonText: '<span style="color: var(--text-heading);">Stay Logged In</span>',
      background: '#ffffff',
      backdrop: 'rgba(15, 23, 42, 0.6)', /* Darker, modern blur-like backdrop */
      customClass: {
        popup: 'swal-custom-popup',
        confirmButton: 'swal-custom-confirm',
        cancelButton: 'swal-custom-cancel'
      },
      showClass: { popup: 'swal-bounce-in' },
      hideClass: { popup: 'swal-bounce-out' }
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsLoggedIn(false);
        window.location.href = '/signin';
      }
    });
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawerOpen(false); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/shop', label: 'Shop' },
    { href: '/about', label: 'About Us' },
    { href: '/contact', label: 'Contact Us' },
  ];

  const LogoSVG = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z" />
    </svg>
  );

  return (
    <>
      {!isCheckout && (
        <div className="announcement-bar" role="banner">
          <div style={{ overflow: 'hidden' }}>
            <div className="announcement-marquee">
              <span>Grand Sale — Up to 70% Off on Festive Collection</span>
              <span>Free Delivery on orders above ₹499</span>
              <span>1 Crore+ Happy Kids Across India</span>
              <span>New Arrivals: Monsoon Collection 2026</span>
              <span>Easy EMI on orders above ₹999</span>
              <span>Free Gift Wrap on orders above ₹1,499</span>
              <span>Grand Sale — Up to 70% Off on Festive Collection</span>
              <span>Free Delivery on orders above ₹499</span>
              <span>1 Crore+ Happy Kids Across India</span>
              <span>New Arrivals: Monsoon Collection 2026</span>
              <span>Easy EMI on orders above ₹999</span>
              <span>Free Gift Wrap on orders above ₹1,499</span>
            </div>
          </div>
        </div>
      )}

      <header id="site-header" style={{ boxShadow: scrolled ? '0 4px 28px rgba(0,0,0,0.08)' : '' }}>
        <div className="container">
          <nav className="navbar" aria-label="Main navigation">
            <Link href="/" className="logo" id="logo-link" aria-label="Chhotu Fashion — Home">
              <div className="logo-mark"><LogoSVG /></div>
              <div className="logo-text-wrap">
                <span className="logo-name">Chhotu Fashion</span>
                <span className="logo-tagline">{isCheckout ? 'Secure Checkout' : "India's #1 Kids Brand"}</span>
              </div>
            </Link>

            {!isCheckout && (
              <>
                <div className="search-bar" role="search">
                  <span className="search-icon-wrap">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                  </span>
                  <input type="search" id="search-input" placeholder="Search kurtas, dresses, shoes…" aria-label="Search products" />
                </div>
                <ul className="nav-links" role="list">
                  {navLinks.map(link => (
                    <li key={link.href}>
                      <Link href={link.href} className={pathname === link.href ? 'active' : ''} aria-current={pathname === link.href ? 'page' : undefined}>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="nav-actions">
                  <Link href="/wishlist" className="nav-icon-btn" id="btn-wishlist" aria-label="Wishlist" style={{ position: 'relative' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                    {wishlistCount > 0 && <span className="cart-badge" id="wishlist-count" aria-label={`${wishlistCount} items`} style={{ background: '#EF4444' }}>{wishlistCount}</span>}
                  </Link>
                  <Link href="/cart" className="nav-icon-btn" id="btn-cart" aria-label="Shopping Cart" style={{ position: 'relative' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                    {cartCount > 0 && <span className="cart-badge" id="cart-count" aria-label={`${cartCount} items`}>{cartCount}</span>}
                  </Link>
                  <Link href="/account" className="nav-icon-btn" id="btn-account" aria-label="My Account">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </Link>
                  {isLoggedIn ? (
                    <button onClick={handleLogout} className="btn-logout" id="signin-btn">
                      Logout
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                    </button>
                  ) : (
                    <Link href="/signin" className="btn-signin" id="signin-btn">Sign In</Link>
                  )}
                </div>
              </>
            )}

            {isCheckout && (
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                100% Secure &amp; Encrypted
              </div>
            )}

            <button className={`hamburger${drawerOpen ? ' open' : ''}`} id="hamburger-btn" aria-label="Open menu" aria-expanded={drawerOpen} onClick={() => setDrawerOpen(v => !v)}>
              <span /><span /><span />
            </button>
          </nav>
        </div>
      </header>

      {!isCheckout && (
        <>
          <div className="mobile-search" id="mobile-search">
            <div className="mobile-search-wrap">
              <span className="mobile-search-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              </span>
              <input type="search" placeholder="Search kurtas, dresses, shoes…" aria-label="Search products" />
            </div>
          </div>

          <div className={`mobile-menu-overlay${drawerOpen ? ' open' : ''}`} id="mobile-overlay" onClick={() => setDrawerOpen(false)} />

          <aside className={`mobile-nav-drawer${drawerOpen ? ' open' : ''}`} id="mobile-drawer" aria-label="Mobile navigation">
            <div className="drawer-head">
              <span className="logo-name">Chhotu Fashion</span>
              <button className="btn-drawer-close" id="close-drawer" aria-label="Close menu" onClick={() => setDrawerOpen(false)}>&times;</button>
            </div>
            <nav className="drawer-body">
              {[
                { href: '/', label: 'Home', icon: <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>, icon2: <polyline points="9 22 9 12 15 12 15 22"/> },
              ].map(() => null)}
              <Link href="/" className={`drawer-link${pathname === '/' ? ' active' : ''}`} onClick={() => setDrawerOpen(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>Home
              </Link>
              <Link href="/shop" className={`drawer-link${pathname === '/shop' ? ' active' : ''}`} onClick={() => setDrawerOpen(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>Shop
              </Link>
              <Link href="/about" className={`drawer-link${pathname === '/about' ? ' active' : ''}`} onClick={() => setDrawerOpen(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>About Us
              </Link>
              <Link href="/contact" className={`drawer-link${pathname === '/contact' ? ' active' : ''}`} onClick={() => setDrawerOpen(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>Contact Us
              </Link>
              <Link href="/wishlist" className={`drawer-link${pathname === '/wishlist' ? ' active' : ''}`} onClick={() => setDrawerOpen(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>Wishlist
              </Link>
              <Link href="/track" className={`drawer-link${pathname === '/track' ? ' active' : ''}`} onClick={() => setDrawerOpen(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>Track Order
              </Link>
            </nav>
            <div className="drawer-actions">
              <Link href="/shop" className="btn-drawer-shop" onClick={() => setDrawerOpen(false)}>🛍️ Shop Now</Link>
              {isLoggedIn ? (
                <button onClick={() => { setDrawerOpen(false); handleLogout(); }} className="btn-drawer-signin" style={{ background: 'transparent', color: 'var(--text-heading)', border: '1.5px solid var(--border)' }}>🚪 Logout</button>
              ) : (
                <Link href="/signin" className="btn-drawer-signin" onClick={() => setDrawerOpen(false)}>👤 Sign In / Register</Link>
              )}
            </div>
          </aside>
        </>
      )}
    </>
  );
}
