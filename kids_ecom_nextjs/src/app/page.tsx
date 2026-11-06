'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { fetchPublic, fetchCustomerAuth } from '@/utils/api';
import { toast } from '@/utils/toast';
import SizePicker from '@/components/SizePicker';
import { getImageUrl } from '@/utils/image';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('All');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
  
  // Size Picker State
  const [sizePickerOpen, setSizePickerOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Load recently viewed from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('recently_viewed');
      if (stored) setRecentlyViewed(JSON.parse(stored));
    } catch {}
  }, []);

  useEffect(() => {
    fetchPublic('/products')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (data?.products) setProducts(data.products);
      })
      .catch(err => {
        console.warn('Failed to load products from API:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  // Scroll reveal
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          (e.target as HTMLElement).style.opacity = '1';
          (e.target as HTMLElement).style.transform = 'translateY(0)';
          observer.unobserve(e.target);
        }
      }),
      { threshold: 0.08 }
    );
    document.querySelectorAll('.product-card, .cat-card, .testimonial-card, .festival-card, .trend-small-card, .brand-chip').forEach((el) => {
      (el as HTMLElement).style.opacity = '0';
      (el as HTMLElement).style.transform = 'translateY(20px)';
      (el as HTMLElement).style.transition = 'opacity .5s ease, transform .5s ease';
      observer.observe(el);
    });
  }, []);

  const initAddToCart = (e: React.MouseEvent<HTMLButtonElement>, p: any) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login to add items to your cart');
      window.location.href = '/signin';
      return;
    }

    const sizes = p.sizes ? p.sizes.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
    if (sizes.length > 1) {
      setSelectedProduct(p);
      setSizePickerOpen(true);
    } else {
      executeAddToCart(e.currentTarget, p, sizes[0] || 'One Size');
    }
  };

  const executeAddToCart = (btn: HTMLElement | null, p: any, size: string) => {
    const price = p.sale || p.mrp;
    
    const rawImg = (p.images && p.images.length > 0) ? (p.images.find((i:any) => i.is_primary)?.image_url || p.images[0].image_url) : (p.img || '');
    
    let variantId = null;
    let variantImg = rawImg;
    
    if (p.variants && p.variants.length > 0) {
      const v = p.variants.find((v:any) => v.size === size);
      if (v) {
        variantId = v.id;
        if (v.image_url) variantImg = v.image_url;
      }
    }
    
    const finalImg = getImageUrl(variantImg, 'thumb');

    fetchCustomerAuth('/cart', {
      method: 'POST',
      body: JSON.stringify({
        product_id: p.id,
        name: p.name,
        meta: size,
        price: String(price),
        img: finalImg,
        quantity: 1,
        variant_id: variantId
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.message) {
        toast.success(data.message);
        
        if (btn) {
          const origHtml = btn.innerHTML;
          btn.innerHTML = 'Added ✓';
          btn.style.background = '#27AE60';
          btn.style.color = '#fff';
          setTimeout(() => {
            btn.innerHTML = origHtml;
            btn.style.background = '';
            btn.style.color = '';
          }, 2000);
        }

        window.dispatchEvent(new Event('cart_updated'));
      } else if (data.error) {
        toast.error(data.error);
      }
    })
    .catch(() => toast.error('Failed to add to cart'));
  };

  const handleNewsletter = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const btn = document.getElementById('nl-submit');
    if(btn) {
      btn.textContent = 'Coupon Sent!';
      btn.style.background = '#27AE60';
      setTimeout(() => { btn.textContent = 'Get Coupon'; btn.style.background = ''; }, 3000);
    }
    const emailInput = document.getElementById('nl-email') as HTMLInputElement;
    if(emailInput) emailInput.value = '';
  };

  const handleToggleWishlist = (e: React.MouseEvent<HTMLButtonElement>, productId: number) => {
    e.preventDefault();
    fetchCustomerAuth('/wishlist/toggle', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId })
    })
    .then(res => res.json())
    .then(data => {
      if (data.status) {
        toast.success(data.status === 'added' ? 'Added to Wishlist' : 'Removed from Wishlist');
      } else if (data.error) {
        toast.error(data.error);
      }
    })
    .catch(err => {
      if (err.message === 'Session Expired' || err.message === 'Unauthorized') {
        window.location.href = '/signin';
      } else {
        toast.error('Please login to add to wishlist');
        window.location.href = '/signin';
      }
    });
  };

  return (
    <>
    {/* CATEGORY NAV */}
    <nav className="category-nav" aria-label="Shop by category">
      <div className="container">
        <div className="category-nav-inner">
          <Link href="/shop" className="cat-link active" id="cat-all">All</Link>
          <Link href="/shop?cat=girls" className="cat-link" id="cat-girls">Girls</Link>
          <Link href="/shop?cat=boys" className="cat-link" id="cat-boys">Boys</Link>
          <Link href="/shop?cat=baby" className="cat-link" id="cat-baby">Baby 0–2</Link>
          <Link href="/shop?cat=ethnic" className="cat-link" id="cat-ethnic">Ethnic Wear</Link>
          <Link href="/shop?cat=western" className="cat-link" id="cat-western">Western</Link>
          <Link href="/shop?cat=school" className="cat-link" id="cat-school">School Wear</Link>
          <Link href="/shop?cat=winter" className="cat-link" id="cat-winter">Winter Wear</Link>
          <Link href="/shop?cat=footwear" className="cat-link" id="cat-footwear">Footwear</Link>
          <Link href="/shop?cat=sale" className="cat-link sale-link" id="cat-sale">Sale</Link>
        </div>
      </div>
    </nav>

    <main id="main-content">
      {/* ═══════════ HERO ═══════════ */}
      <section className="hero" id="hero-section" aria-labelledby="hero-title">
        <div className="container">
          <div className="hero-inner">
            <div className="hero-content">
              <div className="hero-eyebrow">Monsoon Collection 2026</div>
              <h1 className="hero-title" id="hero-title">
                Dress Your Little<br/>Star in Pure <em>Joy</em>
              </h1>
              <p className="hero-desc">India's premier destination for kids fashion — from handcrafted ethnic lehengas to breezy western casuals. Celebrating childhood, one outfit at a time.</p>
              <div className="hero-actions">
                <Link href="/shop?cat=girls" className="btn-primary accent-btn" id="hero-girls-btn">Shop for Girls</Link>
                <Link href="/shop?cat=boys" className="btn-outline" id="hero-boys-btn">Shop for Boys</Link>
              </div>
              <div className="hero-stats">
                <div className="stat-item"><div className="val">1 Cr+</div><div className="lbl">Happy Kids</div></div>
                <div className="stat-item"><div className="val">50K+</div><div className="lbl">Styles</div></div>
                <div className="stat-item"><div className="val">4.8</div><div className="lbl">App Rating</div></div>
              </div>
            </div>

            <div className="hero-visual" aria-hidden="true">
              <img src="/images/hero_banner.jpg" alt="Happy Indian children in festive clothing" width="640" height="560" loading="eager" />
              <div className="hero-badge b1">
                <div className="hero-badge-label">Free Delivery</div>
                <div className="hero-badge-value">Above ₹499</div>
              </div>
              <div className="hero-badge b2">
                <div className="hero-badge-label">Today's Offer</div>
                <div className="hero-badge-value">Upto 70% Off</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ TRUST BAR ═══════════ */}
      <section className="trust-bar" aria-label="Service highlights">
        <div className="container">
          <div className="trust-bar-inner">
            <div className="trust-item">
              <div className="trust-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
              </div>
              <div><div className="trust-title">Free Delivery</div><div className="trust-sub">On orders above ₹499</div></div>
            </div>
            <div className="trust-item">
              <div className="trust-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.51"/></svg>
              </div>
              <div><div className="trust-title">Easy 7-Day Returns</div><div className="trust-sub">No questions asked</div></div>
            </div>
            <div className="trust-item">
              <div className="trust-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <div><div className="trust-title">Secure Payments</div><div className="trust-sub">UPI, Cards, Net Banking</div></div>
            </div>
            <div className="trust-item">
              <div className="trust-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M7 13s1.5 2 5 2 5-2 5-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
              </div>
              <div><div className="trust-title">Skin-Safe Fabrics</div><div className="trust-sub">100% tested & certified</div></div>
            </div>
            <div className="trust-item">
              <div className="trust-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
              </div>
              <div><div className="trust-title">Gift Wrapping</div><div className="trust-sub">Free on orders ₹1,499+</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ CATEGORIES ═══════════ */}
      <section className="categories-section" id="categories" aria-labelledby="categories-title">
        <div className="container">
          <div className="section-header">
            <div>
              <span className="section-label">Collections</span>
              <h2 className="section-title" id="categories-title">Shop by Category</h2>
            </div>
            <Link href="/shop" className="view-all-link" id="cat-view-all">View All</Link>
          </div>

          <div className="categories-grid">
            <article className="cat-card span2" id="cat-festive">
              <img src="/images/product_girls_festive.jpg" alt="Festive ethnic wear collection" loading="lazy" />
              <div className="cat-card-info">
                <h3>Festive & Ethnic</h3>
                <p>Lehengas, Sherwanis & more</p>
              </div>
              <div className="cat-card-badge"><span className="badge badge-hot">Trending</span></div>
            </article>
            <article className="cat-card" id="cat-girls-w">
              <img src="/images/product_girls_western.jpg" alt="Girls western wear" loading="lazy" />
              <div className="cat-card-info">
                <h3>Girls Western</h3>
                <p>Dresses, Tops & more</p>
              </div>
              <div className="cat-card-badge"><span className="badge badge-new">New</span></div>
            </article>
            <article className="cat-card" id="cat-boys-c">
              <img src="/images/product_boys_casual.jpg" alt="Boys casual wear" loading="lazy" />
              <div className="cat-card-info">
                <h3>Boys Casual</h3>
                <p>T-shirts, Shorts & Jeans</p>
              </div>
            </article>
            <article className="cat-card" id="cat-boys-e">
              <img src="/images/product_boys_ethnic.jpg" alt="Boys ethnic wear" loading="lazy" />
              <div className="cat-card-info">
                <h3>Boys Ethnic</h3>
                <p>Kurtas, Sherwanis</p>
              </div>
              <div className="cat-card-badge"><span className="badge badge-sale">Sale</span></div>
            </article>
          </div>
        </div>
      </section>

      {/* ═══════════ AGE FILTER ═══════════ */}
      <section style={{ padding: '40px 0', background: 'var(--bg-white)', borderBottom: '1px solid var(--border)' }} aria-labelledby="age-filter-title">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <span className="section-label">Shop By Age</span>
            <h2 className="section-title" id="age-filter-title">Find the Perfect Fit</h2>
          </div>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { label: '0–2 Yrs', sublabel: 'Newborns & Toddlers', icon: '👶', cat: 'baby', color: '#FFF3CD' },
              { label: '3–5 Yrs', sublabel: 'Little Ones', icon: '👧', cat: 'girls', color: '#FCE4EC' },
              { label: '6–9 Yrs', sublabel: 'Growing Kids', icon: '👦', cat: 'boys', color: '#E3F2FD' },
              { label: '10–12 Yrs', sublabel: 'Tweens', icon: '🎓', cat: 'school', color: '#E8F5E9' },
              { label: 'Festival Wear', sublabel: 'All Ages', icon: '🌟', cat: 'ethnic', color: '#FFF8E1' },
            ].map(a => (
              <a key={a.label} href={`/shop?cat=${a.cat}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '20px 24px', background: a.color, borderRadius: '16px', minWidth: '130px', transition: 'transform 0.2s, box-shadow 0.2s', border: '1px solid transparent' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.10)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
              >
                <span style={{ fontSize: '36px' }}>{a.icon}</span>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-heading)' }}>{a.label}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{a.sublabel}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ PRODUCTS ═══════════ */}
      <section className="products-section" id="best-sellers" aria-labelledby="products-title">
        <div className="container">
          <div className="section-header">
            <div>
              <span className="section-label">Curated for You</span>
              <h2 className="section-title" id="products-title">Best Sellers This Week</h2>
            </div>
            <Link href="/shop" className="view-all-link" id="products-view-all">View All</Link>
          </div>

          <div className="product-tabs" role="tablist">
            <button className={`tab-btn ${activeTab==='All'?'active':''}`} onClick={()=>setActiveTab('All')}>All</button>
            <button className={`tab-btn ${activeTab==='Girls'?'active':''}`} onClick={()=>setActiveTab('Girls')}>Girls</button>
            <button className={`tab-btn ${activeTab==='Boys'?'active':''}`} onClick={()=>setActiveTab('Boys')}>Boys</button>
            <button className={`tab-btn ${activeTab==='Ethnic'?'active':''}`} onClick={()=>setActiveTab('Ethnic')}>Ethnic</button>
            <button className={`tab-btn ${activeTab==='Western'?'active':''}`} onClick={()=>setActiveTab('Western')}>Western</button>
            <button className={`tab-btn ${activeTab==='Baby'?'active':''}`} onClick={()=>setActiveTab('Baby')}>Baby</button>
          </div>

          <div className="products-grid" id="product-grid">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <article className="product-card skeleton-card" key={`sk-${i}`}>
                    <div className="product-image-wrap skeleton" style={{ paddingTop: '125%' }}></div>
                    <div className="product-info" style={{ padding: '16px' }}>
                      <div className="skeleton skeleton-text" style={{ width: '40%' }}></div>
                      <div className="skeleton skeleton-text" style={{ height: '20px', width: '80%', marginBottom: '12px' }}></div>
                      <div className="skeleton skeleton-text" style={{ height: '18px', width: '60%' }}></div>
                    </div>
                  </article>
                ))
              ) : products
              .filter(p => activeTab === 'All' ? true : p.category?.toLowerCase().includes(activeTab.toLowerCase()))
              .map((p: any) => {
              const firstImg = (p.images && p.images.length > 0) ? (p.images.find((i:any) => i.is_primary)?.image_url || p.images[0].image_url) : '';
              const src = getImageUrl(firstImg, 'thumb');
              const discount = p.mrp && p.sale && p.mrp > p.sale ? Math.round((1 - p.sale / p.mrp) * 100) : 0;
              return (
                <article key={p.id} className="product-card" id={`product-${p.id}`}>
                  <Link href={`/product?id=${p.id}`} style={{ display: 'block' }}>
                    <div className="product-image-wrap">
                      <img src={src} alt={p.name} loading="lazy" />
                      {discount > 0 && <span className="product-discount-tag">-{discount}%</span>}
                    </div>
                  </Link>
                  <div className="product-actions">
                    <button className="product-action-btn" aria-label="Quick View" onClick={(e) => { e.preventDefault(); window.location.href=`/product?id=${p.id}`; }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                    <button className="product-action-btn" aria-label="Add to wishlist" onClick={(e) => handleToggleWishlist(e, p.id)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                    </button>
                  </div>
                  <div className="product-info">
                    <p className="product-brand">{p.category || 'Chhotu Fashion'}</p>
                    <h3 className="product-name"><Link href={`/product?id=${p.id}`}>{p.name}</Link></h3>
                    <div className="product-rating">
                      <div className="stars" aria-label="5 out of 5">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                        ))}
                      </div>
                      <span className="rating-count">(0)</span>
                    </div>
                    <div className="product-pricing">
                      <span className="price-current">₹{p.sale || p.mrp}</span>
                      {p.sale && p.mrp && p.sale < p.mrp && <span className="price-original">₹{p.mrp}</span>}
                      {discount > 0 && <span className="price-save">Save ₹{p.mrp - p.sale}</span>}
                    </div>
                    <button className="btn-add-cart" aria-label="Add to cart" onClick={(e) => initAddToCart(e, p)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                      Add to Cart
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════ TRENDING ═══════════ */}
      <section className="trending-section" id="trending" aria-labelledby="trending-title">
        <div className="container">
          <div className="section-header">
            <div>
              <span className="section-label">What's Hot</span>
              <h2 className="section-title" id="trending-title">Trending Now</h2>
            </div>
          </div>
          <div className="trending-grid">
            {products.length > 0 && (
              <article className="trend-big-card" id={`trend-${products[0].id}`}>
                <img src={getImageUrl((products[0].images && products[0].images.length > 0) ? (products[0].images.find((i:any) => i.is_primary)?.image_url || products[0].images[0].image_url) : '', 'optimized')} alt={products[0].name} loading="lazy" />
                <div className="trend-big-overlay">
                  <span className="badge badge-hot">Trending</span>
                  <h3>{products[0].name}</h3>
                  <p>Modern cuts meet traditional embroidery — the signature look of the season.</p>
                  <Link href={`/product?id=${products[0].id}`} className="btn-ghost-light">Explore Now</Link>
                </div>
              </article>
            )}
            <div className="trend-small-cards">
              {products.slice(1, 4).map((p: any, idx: number) => {
                const firstImg = (p.images && p.images.length > 0) ? (p.images.find((i:any) => i.is_primary)?.image_url || p.images[0].image_url) : '';
                const src = getImageUrl(firstImg, 'thumb');
                const badges = ['Hot', 'New', 'Sale'];
                const badgeClass = ['badge-hot', 'badge-new', 'badge-sale'];
                return (
                  <article key={p.id} className="trend-small-card" id={`trend-small-${p.id}`}>
                    <img src={src} alt={p.name} loading="lazy" />
                    <div className="trend-small-info">
                      <span className={`badge ${badgeClass[idx%3]}`}>{badges[idx%3]}</span>
                      <h4><Link href={`/product?id=${p.id}`} style={{color:'inherit', textDecoration:'none'}}>{p.name}</Link></h4>
                      <div>
                        <span className="price">₹{p.sale || p.mrp}</span>
                        {p.sale && p.mrp && p.sale < p.mrp && <span className="price-old">₹{p.mrp}</span>}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ FESTIVAL BANNERS ═══════════ */}
      <section className="festival-section" id="festival-section" aria-labelledby="festival-title">
        <div className="container">
          <div className="section-header">
            <div>
              <span className="section-label">Celebrations</span>
              <h2 className="section-title" id="festival-title">Festival Collections</h2>
            </div>
          </div>
          <div className="festival-grid">
            <div className="festival-card card-diwali" id="festival-diwali">
              <div className="festival-card-label">Limited Collection</div>
              <div className="festival-deco"></div>
              <h2>Diwali Special</h2>
              <p>Glow in gorgeous ethnic outfits. Lehengas, sherwanis, and more — up to 60% off.</p>
              <Link href="/shop?cat=ethnic" className="btn-ghost" id="diwali-btn">Explore Collection</Link>
            </div>
            <div className="festival-card card-eid" id="festival-eid">
              <div className="festival-card-label">New Arrivals</div>
              <div className="festival-deco"></div>
              <h2>Eid Collection</h2>
              <p>Celebrate in elegance with our premium Eid range. Shararas, kurtas, anarkalis.</p>
              <Link href="/shop?cat=ethnic" className="btn-ghost" id="eid-btn">Explore Collection</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ BRANDS ═══════════ */}
      <section className="brands-section" id="brands-section" aria-labelledby="brands-title">
        <div className="container">
          <div className="section-header">
            <div>
              <span className="section-label">Partners</span>
              <h2 className="section-title" id="brands-title">Top Kids Brands</h2>
            </div>
            <Link href="/shop" className="view-all-link" id="brands-view-all">All Brands</Link>
          </div>
          <div className="brands-scroll" role="list">
            <div className="brand-chip" role="listitem" id="brand-hopscotch">Hopscotch</div>
            <div className="brand-chip" role="listitem" id="brand-firstcry">FirstCry</div>
            <div className="brand-chip" role="listitem" id="brand-gini">Gini &amp; Jony</div>
            <div className="brand-chip" role="listitem" id="brand-biba">Biba Kids</div>
            <div className="brand-chip" role="listitem" id="brand-hm">H&amp;M Kids</div>
            <div className="brand-chip" role="listitem" id="brand-zara">Zara Kids</div>
            <div className="brand-chip" role="listitem" id="brand-mothercare">Mothercare</div>
            <div className="brand-chip" role="listitem" id="brand-lilpicks">Lil Picks</div>
            <div className="brand-chip" role="listitem" id="brand-muffet">Little Muffet</div>
            <div className="brand-chip" role="listitem" id="brand-fabindia">FabIndia Kids</div>
          </div>
        </div>
      </section>

      {/* ═══════════ TESTIMONIALS ═══════════ */}
      <section className="testimonials-section" id="testimonials" aria-labelledby="testimonials-title">
        <div className="container">
          <div style={{textAlign:'center'}}>
            <span className="section-label">Customer Reviews</span>
            <h2 className="section-title" id="testimonials-title">Trusted by Indian Parents</h2>
            <p className="section-sub">Over 1 crore happy families across India</p>
          </div>
          <div className="testimonials-grid">
            <article className="testimonial-card" id="review-1">
              <div className="testimonial-stars">
                <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </div>
              <p className="testimonial-text">"My daughter wore the lehenga for Navratri and she was the star of the event! The quality is outstanding and delivery was super fast. Will definitely order again."</p>
              <div className="testimonial-author">
                <div className="author-initials">PS</div>
                <div><div className="author-name">Priya Sharma</div><div className="author-loc">Jaipur, Rajasthan</div></div>
              </div>
            </article>
            <article className="testimonial-card" id="review-2">
              <div className="testimonial-stars">
                <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </div>
              <p className="testimonial-text">"Ordered the kurta pajama set for my son's cousin's wedding. Absolutely loved the fabric and embroidery! Got so many compliments. Chhotu Fashion never disappoints."</p>
              <div className="testimonial-author">
                <div className="author-initials">RM</div>
                <div><div className="author-name">Rahul Mehta</div><div className="author-loc">Surat, Gujarat</div></div>
              </div>
            </article>
            <article className="testimonial-card" id="review-3">
              <div className="testimonial-stars">
                <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </div>
              <p className="testimonial-text">"The best Indian kids fashion app by far. The ethnic collection is unmatched. Perfect sizes, hassle-free returns. Highly recommend to all parents!"</p>
              <div className="testimonial-author">
                <div className="author-initials">AP</div>
                <div><div className="author-name">Anjali Patel</div><div className="author-loc">Mumbai, Maharashtra</div></div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ═══════════ RECENTLY VIEWED ═══════════ */}
      {recentlyViewed.length > 0 && (
        <section style={{ padding: '48px 0', background: 'var(--bg)' }} aria-labelledby="recently-viewed-title">
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <span className="section-label">Your History</span>
              <h2 className="section-title" id="recently-viewed-title">Recently Viewed</h2>
            </div>
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap', paddingBottom: '12px' }}>
              {recentlyViewed.map(p => {
                const imgStr = (p.images && p.images.length > 0) ? (p.images.find((i:any) => i.is_primary)?.image_url || p.images[0].image_url) : (p.img || '/images/product_placeholder.jpg');
                const src = getImageUrl(imgStr, 'thumb');
                return (
                  <a key={p.id} href={`/product?id=${p.id}`} style={{ textDecoration: 'none', flexShrink: 0, width: '160px', textAlign: 'center' }}>
                    <div style={{ width: '160px', height: '200px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)', marginBottom: '10px', background: '#fff' }}>
                      <img src={src} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.05)'}
                        onMouseLeave={e => (e.currentTarget as HTMLImageElement).style.transform = ''}
                      />
                    </div>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-heading)', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</p>
                    <p style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 700 }}>₹{p.sale || p.mrp}</p>
                  </a>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════ NEWSLETTER ═══════════ */}
      <section className="newsletter-section" id="newsletter" aria-labelledby="newsletter-title">
        <div className="container">
          <div className="newsletter-inner">
            <span className="nl-label">Exclusive Offer</span>
            <h2 id="newsletter-title">Get ₹200 Off Your First Order</h2>
            <p>Subscribe for exclusive deals, new arrivals &amp; festival collection alerts. No spam, ever.</p>
            <form className="newsletter-form" id="newsletter-form" onSubmit={handleNewsletter}>
              <label htmlFor="nl-email" className="sr-only">Email address</label>
              <input type="email" id="nl-email" name="email" placeholder="Enter your email address" required />
              <button type="submit" className="btn-sub" id="nl-submit">Get Coupon</button>
            </form>
            <p className="nl-note">We respect your privacy. Unsubscribe anytime.</p>
          </div>
        </div>
      </section>
    </main>

    {sizePickerOpen && selectedProduct && (
      <SizePicker 
        product={selectedProduct} 
        onClose={() => { setSizePickerOpen(false); setSelectedProduct(null); }}
        onConfirm={(size) => {
          executeAddToCart(null, selectedProduct, size);
          setSizePickerOpen(false);
          setSelectedProduct(null);
        }}
      />
    )}
    </>
  );
}