'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();
  const isCheckout = pathname === '/checkout';
  if (isCheckout) return null;

  const chevron = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" style={{ marginRight: '8px', verticalAlign: 'middle', color: 'var(--primary)' }}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );

  return (
    <>
      <footer id="site-footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <Link href="/" className="logo" style={{ marginBottom: '16px' }}>
                <div className="logo-mark">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
                    <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z" />
                  </svg>
                </div>
                <div className="logo-text-wrap">
                  <span className="logo-name" style={{ color: '#fff' }}>Chhotu Fashion</span>
                  <span className="logo-tagline" style={{ color: 'rgba(255,255,255,0.5)' }}>India&apos;s #1 Kids Brand</span>
                </div>
              </Link>
              <p className="footer-desc">India&apos;s #1 kids clothing destination. Premium ethnic, western &amp; casual wear for children aged 0–14 years. Making every child&apos;s moment special since 2010.</p>
              <div className="social-links">
                <a href="#" className="social-btn" id="soc-ig" aria-label="Instagram">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                </a>
                <a href="#" className="social-btn" id="soc-fb" aria-label="Facebook">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                </a>
                <a href="#" className="social-btn" id="soc-yt" aria-label="YouTube">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/></svg>
                </a>
                <a href="#" className="social-btn" id="soc-pin" aria-label="Pinterest">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 12a4 4 0 0 1 8 0c0 2.21-1.79 4-4 4-1.1 0-2.1-.45-2.83-1.17"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M10.5 16l-1 5"/></svg>
                </a>
              </div>
            </div>
            <div className="footer-col">
              <h4>Shop</h4>
              <ul>
                <li><Link href="/shop?cat=girls">{chevron}Girls</Link></li>
                <li><Link href="/shop?cat=boys">{chevron}Boys</Link></li>
                <li><Link href="/shop?cat=baby">{chevron}Baby &amp; Newborn</Link></li>
                <li><Link href="/shop?cat=ethnic">{chevron}Ethnic Wear</Link></li>
                <li><Link href="/shop?cat=western">{chevron}Western Wear</Link></li>
                <li><Link href="/shop?cat=school">{chevron}School Uniforms</Link></li>
                <li><Link href="/shop?cat=sale">{chevron}Sale</Link></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Help</h4>
              <ul>
                <li><Link href="/track">{chevron}Track Order</Link></li>
                <li><a href="#">{chevron}Returns &amp; Exchange</a></li>
                <li><a href="#">{chevron}Size Guide</a></li>
                <li><Link href="/contact">{chevron}Contact Us</Link></li>
                <li><a href="#">{chevron}Store Locator</a></li>
                <li><a href="#">{chevron}FAQs</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Company</h4>
              <ul>
                <li><Link href="/about">{chevron}About Us</Link></li>
                <li><a href="#">{chevron}Blog</a></li>
                <li><a href="#">{chevron}Careers</a></li>
                <li><a href="#">{chevron}Press &amp; Media</a></li>
                <li><a href="#">{chevron}Privacy Policy</a></li>
                <li><a href="#">{chevron}Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2026 Chhotu Fashion Pvt. Ltd. — Made in India. Crafted with <svg viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" style={{ verticalAlign: 'middle', margin: '0 2px', display: 'inline-block' }}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> by <a href="https://zivaansolutions.com" target="_blank" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Zivaan Solutions</a></p>
            <div className="payment-icons">
              <div className="payment-icon">UPI</div>
              <div className="payment-icon">Visa</div>
              <div className="payment-icon">Mastercard</div>
              <div className="payment-icon">Paytm</div>
              <div className="payment-icon">GPay</div>
              <div className="payment-icon">COD</div>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Nav */}
      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        <div className="mobile-nav-inner">
          <Link href="/" className={`mob-nav-item${pathname === '/' ? ' active' : ''}`} aria-current={pathname === '/' ? 'page' : undefined}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            Home
          </Link>
          <Link href="/shop" className={`mob-nav-item${pathname === '/shop' ? ' active' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            Shop
          </Link>
          <Link href="/shop" className="mob-nav-item" id="mob-search-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            Search
          </Link>
          <Link href="/wishlist" className={`mob-nav-item${pathname === '/wishlist' ? ' active' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            Wishlist
          </Link>
          <Link href="/account" className={`mob-nav-item${pathname === '/account' ? ' active' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Account
          </Link>
        </div>
      </nav>
    </>
  );
}
