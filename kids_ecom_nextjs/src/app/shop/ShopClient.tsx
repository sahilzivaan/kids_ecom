'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchPublic, fetchCustomerAuth } from '@/utils/api';
import { toast } from '@/utils/toast';
import { getImageUrl } from '@/utils/image';
import Modal from '@/components/admin/Modal';

export default function ShopClient() {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [gridView, setGridView] = useState(true);
  const [activeSizes, setActiveSizes] = useState<string[]>([]);
  
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [maxPrice, setMaxPrice] = useState(5000);
  const [sortBy, setSortBy] = useState('newest');
  
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observerTarget = useRef<HTMLDivElement>(null);
  
  const [quickViewProduct, setQuickViewProduct] = useState<any>(null);
  const [qvColor, setQvColor] = useState('');
  const [qvSize, setQvSize] = useState('');

  // Auto-select first color when quick view opens
  useEffect(() => {
    if (quickViewProduct?.variants) {
      const colors = Array.from(new Set(quickViewProduct.variants.map((v:any) => v.color).filter(Boolean)));
      if (colors.length > 0) {
        setQvColor(colors[0] as string);
      } else {
        setQvColor('');
      }
      setQvSize('');
    }
  }, [quickViewProduct]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [categoryFilter, maxPrice, sortBy]);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(page === 1);
      try {
        let url = '/products';
        const params = new URLSearchParams();
        if (categoryFilter.length > 0) params.append('category', categoryFilter[0]);
        if (debouncedSearch) params.append('search', debouncedSearch);
        params.append('max_price', String(maxPrice));
        params.append('sort_by', sortBy);
        params.append('page', String(page));
        params.append('limit', '12');
        
        const qs = params.toString();
        if (qs) url += `?${qs}`;
        
        const res = await fetchPublic(url);
        if (res.ok) {
          const json = await res.json();
          let items = json.products || [];
          
          if (page === 1) {
            setProducts(items);
          } else {
            setProducts(prev => [...prev, ...items]);
          }
          
          if (json.pagination) {
            setHasMore(json.pagination.has_more);
          } else {
            setHasMore(items.length === 12); // Fallback
          }
        }
      } catch (err) {
        console.error('Failed to load products');
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, [categoryFilter, debouncedSearch, maxPrice, sortBy, page]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage(p => p + 1);
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading]);

  const toggleSize = (s: string) => setActiveSizes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  
  const toggleCategory = (cat: string) => {
    // Only supporting single category filter for this demo
    setCategoryFilter(prev => prev.includes(cat) ? [] : [cat]);
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
        window.dispatchEvent(new Event('wishlist_updated'));
      } else if (data.error) {
        toast.error(data.error);
      }
    })
    .catch(err => {
      if (err.message === 'Session Expired' || err.message === 'Unauthorized') {
        toast.error('Please login to add to wishlist');
      } else {
        toast.error('Please login to add to wishlist');
      }
    });
  };

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>, p: any) => {
    e.preventDefault();
    const btn = e.currentTarget;
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login to add items to your cart');
      window.location.href = '/signin';
      return;
    }

    const price = p.sale || p.mrp;
    const rawImg = (p.images && p.images.length > 0) ? (p.images.find((i:any) => i.is_primary)?.image_url || p.images[0].image_url) : '';
    
    let variantId = null;
    let variantImg = rawImg;
    if (p.variants && p.variants.length > 0) {
      // Find the specific variant to add
      const v = p.variants.find((v:any) => v.color === (p === quickViewProduct ? qvColor : '') && v.size === (p === quickViewProduct ? qvSize : ''));
      if (v) {
        variantId = v.id;
        if (v.image_url) variantImg = v.image_url;
      }
    }
    
    const img = getImageUrl(variantImg, 'thumb');

    fetchCustomerAuth('/cart', {
      method: 'POST',
      body: JSON.stringify({
        product_id: p.id,
        name: p.name,
        meta: (p === quickViewProduct && qvColor && qvSize) ? `${qvColor} / ${qvSize}` : 'One Size',
        price: String(price),
        img: img,
        quantity: 1,
        variant_id: variantId
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.message) {
        toast.success(data.message);
        
        // Visual feedback on button
        const origHtml = btn.innerHTML;
        btn.innerHTML = 'Added to Cart ✓';
        btn.style.background = '#27AE60';
        btn.style.color = '#fff';
        setTimeout(() => {
          btn.innerHTML = origHtml;
          btn.style.background = '';
          btn.style.color = '';
        }, 2000);

        window.dispatchEvent(new Event('cart_updated'));
      } else if (data.error) {
        toast.error(data.error);
      }
    })
    .catch(() => toast.error('Failed to add to cart'));
  };

  return (
    <main id="main-content">
      <style>{`
        .shop-layout { display: grid; grid-template-columns: 280px 1fr; gap: 32px; padding-top: 40px; padding-bottom: 80px; align-items: start; position: relative; }
        .filter-sidebar { background: #fff; border-radius: var(--radius-md); border: 1px solid var(--border); padding: 24px; position: sticky; top: 120px; max-height: calc(100vh - 140px); overflow-y: auto; scrollbar-width: thin; }
        .filter-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--border); }
        .filter-header h2 { font-size: 16px; font-weight: 700; color: var(--text-heading); }
        .btn-clear-all { font-size: 12px; font-weight: 600; color: var(--primary); cursor: pointer; background: none; border: none; }
        .filter-group { margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid var(--border); }
        .filter-group:last-child { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }
        .filter-title { font-size: 14px; font-weight: 600; color: var(--text-heading); margin-bottom: 16px; }
        .filter-list { display: flex; flex-direction: column; gap: 12px; }
        .filter-label { display: flex; align-items: center; gap: 10px; font-size: 13.5px; color: var(--text-body); cursor: pointer; }
        .filter-label input { width: 16px; height: 16px; accent-color: var(--primary); cursor: pointer; }
        .filter-count { margin-left: auto; font-size: 11px; color: var(--text-light); }
        .size-grid { display: flex; flex-wrap: wrap; gap: 8px; }
        .size-chip { padding: 6px 12px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 12px; font-weight: 500; color: var(--text-body); cursor: pointer; transition: all .2s; }
        .size-chip.active { background: var(--accent); border-color: var(--accent); color: #fff; }
        .shop-toolbar { display: flex; justify-content: space-between; align-items: center; background: #fff; padding: 16px 24px; border-radius: var(--radius-md); border: 1px solid var(--border); margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
        .active-filters { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; flex: 1; }
        .toolbar-actions { display: flex; align-items: center; gap: 16px; }
        .sort-select { padding: 8px 32px 8px 12px; font-size: 13px; border: 1px solid var(--border); border-radius: var(--radius-sm); outline: none; cursor: pointer; }
        .view-toggles { display: flex; gap: 4px; background: var(--bg-subtle); padding: 4px; border-radius: var(--radius-sm); }
        .view-btn { width: 32px; height: 32px; border-radius: var(--radius-xs); display: flex; align-items: center; justify-content: center; color: var(--text-muted); transition: all .2s; border: none; cursor: pointer; background: none; }
        .view-btn.active { background: #fff; color: var(--primary); box-shadow: var(--shadow-xs); }
        .view-btn svg { width: 16px; height: 16px; }
        .shop-products-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .shop-products-grid.list-view { grid-template-columns: 1fr; }
        .shop-products-grid.list-view .product-card { display: flex; flex-direction: row; align-items: stretch; }
        .shop-products-grid.list-view .product-image-wrap { width: 280px; flex-shrink: 0; aspect-ratio: 4/5; }
        .shop-products-grid.list-view .product-info { flex: 1; padding: 32px; display: flex; flex-direction: column; justify-content: center; }
        .shop-products-grid.list-view .product-name { font-size: 18px; margin-bottom: 12px; }
        .shop-products-grid.list-view .btn-add-cart { width: fit-content; padding: 12px 32px; margin-top: auto; }
        
        .pagination { display: flex; justify-content: center; align-items: center; gap: 8px; margin-top: 48px; }
        .page-btn { width: 36px; height: 36px; border-radius: var(--radius-sm); border: 1px solid var(--border); background: #fff; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; color: var(--text-body); cursor: pointer; transition: all .2s; }
        .page-btn.active { background: var(--accent); border-color: var(--accent); color: #fff; }
        .filter-toggle-btn { display: none; width: 100%; padding: 14px; background: var(--accent); color: #fff; font-weight: 600; font-size: 14px; border-radius: var(--radius-md); text-align: center; margin-bottom: 20px; border: none; cursor: pointer; }
        .filter-toggle-btn svg { width: 18px; height: 18px; }
        
        .mobile-filter-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 2004; opacity: 0; transition: opacity 0.35s; }
        .mobile-filter-overlay.open { display: block; opacity: 1; }
        .btn-close-filter { display: none; font-size: 24px; color: var(--text-heading); cursor: pointer; line-height: 1; border: none; background: none; padding: 0 8px; }

        @media (max-width: 1024px) {
          .shop-layout { grid-template-columns: 240px 1fr; }
          .shop-products-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 900px) {
          .shop-layout { grid-template-columns: 1fr; }
          .filter-sidebar {
            position: fixed; top: 0; left: 0; bottom: 0; width: 280px;
            z-index: 2005; border-radius: 0; max-height: 100vh;
            box-shadow: var(--shadow-xl); transform: translateX(-100%);
            visibility: hidden; transition: transform 0.35s var(--ease), visibility 0.35s;
          }
          .filter-sidebar.open { visibility: visible; transform: translateX(0); }
          .filter-toggle-btn { display: flex; align-items: center; justify-content: center; gap: 8px; }
          .btn-close-filter { display: block; }
          .shop-products-grid.list-view .product-image-wrap { width: 200px; }
          .shop-products-grid.list-view .product-info { padding: 20px; }
          .shop-products-grid.list-view .product-name { font-size: 16px; }
        }
        @media (max-width: 768px) {
          .shop-toolbar { flex-direction: column; align-items: stretch; padding: 14px 16px; gap: 12px; }
          .active-filters { width: 100%; }
          .active-filters > div { width: 100%; }
          .toolbar-actions { justify-content: space-between; width: 100%; }
          .sort-select { flex: 1; min-width: 0; font-size: 13px; }
          .shop-products-grid { grid-template-columns: repeat(2, 1fr); gap: 16px; }
        }
        @media (max-width: 500px) {
          .shop-products-grid { grid-template-columns: 1fr; gap: 16px; }
          .product-image-wrap { aspect-ratio: 4/5; }
          .shop-products-grid.list-view .product-card { flex-direction: row; align-items: center; }
          .shop-products-grid.list-view .product-image-wrap { width: 120px; }
          .shop-products-grid.list-view .product-info { padding: 12px 44px 12px 12px; display: block; }
          .shop-products-grid.list-view .product-name { font-size: 13px; margin-bottom: 6px; }
          .shop-products-grid.list-view .btn-add-cart { width: 100%; padding: 8px; font-size: 11px; margin-top: 8px; }
          .shop-products-grid.list-view .product-discount-tag { top: 6px; left: 6px; font-size: 9px; padding: 2px 6px; }
        }
        @media (max-width: 380px) {
          .shop-products-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
        }
      `}</style>

      <section style={{ background: 'linear-gradient(135deg, rgba(212,82,42,0.06) 0%, rgba(212,82,42,0.01) 100%)', padding: '36px 0 24px', borderBottom: '1px solid rgba(212,82,42,0.1)' }}>
        <div className="container">
          <span className="section-label">All Products</span>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(26px,4vw,40px)', color: 'var(--text-heading)', marginBottom: '6px' }}>Kids Clothing Collection</h1>
          <p style={{ fontSize: '15px', color: 'var(--text-muted)' }}>Showing {products.length} results</p>
        </div>
      </section>

      <div className="container">
        <button className="filter-toggle-btn" onClick={() => setFiltersOpen(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="12" y1="18" x2="12" y2="18"/></svg>
          Filter &amp; Sort
        </button>

        <div className="shop-layout">
          {/* Sidebar */}
          <div className={`mobile-filter-overlay${filtersOpen ? ' open' : ''}`} onClick={() => setFiltersOpen(false)} aria-hidden="true" />
          <aside className={`filter-sidebar${filtersOpen ? ' open' : ''}`}>
            <div className="filter-header">
              <h2>Filters</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button className="btn-clear-all" onClick={() => { setCategoryFilter([]); setActiveSizes([]); setMaxPrice(5000); setSearchQuery(''); }}>Clear All</button>
                <button className="btn-close-filter" aria-label="Close filters" onClick={() => setFiltersOpen(false)}>&times;</button>
              </div>
            </div>
            <div className="filter-group">
              <div className="filter-title">Category</div>
              <div className="filter-list">
                {['Girls', 'Boys', 'Baby 0-2', 'Ethnic'].map((label) => (
                  <label key={label} className="filter-label">
                    <input 
                      type="checkbox" 
                      checked={categoryFilter.includes(label)}
                      onChange={() => toggleCategory(label)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <div className="filter-group">
              <div className="filter-title">Age / Size</div>
              <div className="size-grid">
                {['0-6M', '6-12M', '1-2Y', '3-4Y', '5-6Y', '7-8Y', '9-10Y', '11-12Y', '13-14Y'].map(s => (
                  <button key={s} className={`size-chip${activeSizes.includes(s) ? ' active' : ''}`} onClick={() => toggleSize(s)}>{s}</button>
                ))}
              </div>
            </div>
            <div className="filter-group">
              <div className="filter-title">Price Range</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input 
                  type="range" 
                  min="0" 
                  max="5000" 
                  step="100"
                  value={maxPrice} 
                  onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--primary)' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted)' }}>
                  <span>₹0</span><span>₹{maxPrice.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="filter-group">
              <div className="filter-title">Brand</div>
              <div className="filter-list">
                {['Chhotu Fashion', 'Hopscotch', 'Gini & Jony', 'Biba Kids', 'H&M Kids'].map(b => (
                  <label key={b} className="filter-label"><input type="checkbox" />{b}</label>
                ))}
              </div>
            </div>
          </aside>

          {/* Main */}
          <div>
            <div className="shop-toolbar">
              <div className="active-filters">
                <div style={{ position: 'relative', width: '250px' }}>
                  <input 
                    type="text" 
                    placeholder="Search products..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px 8px 32px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}
                  />
                  <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}>🔍</span>
                </div>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{products.length} products</span>
              </div>
              <div className="toolbar-actions">
                <select className="sort-select" aria-label="Sort by" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="newest">Newest First</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
                <div className="view-toggles">
                  <button className={`view-btn${gridView ? ' active' : ''}`} onClick={() => setGridView(true)} aria-label="Grid view">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                  </button>
                  <button className={`view-btn${!gridView ? ' active' : ''}`} onClick={() => setGridView(false)} aria-label="List view">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                  </button>
                </div>
              </div>
            </div>

            <div className={`shop-products-grid${!gridView ? ' list-view' : ''}`}>
              {loading && products.length === 0 ? (
                Array.from({ length: 12 }).map((_, i) => (
                  <article className="product-card skeleton-card" key={`sk-${i}`}>
                    <div className="product-image-wrap skeleton" style={{ paddingTop: '125%' }}></div>
                    <div className="product-info" style={{ padding: '16px' }}>
                      <div className="skeleton skeleton-text" style={{ width: '40%' }}></div>
                      <div className="skeleton skeleton-text" style={{ height: '20px', width: '80%', marginBottom: '12px' }}></div>
                      <div className="skeleton skeleton-text" style={{ height: '18px', width: '60%' }}></div>
                    </div>
                  </article>
                ))
              ) : products.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', padding: '60px', textAlign: 'center', color: 'var(--muted)' }}>
                  No products found.
                </div>
              ) : products.map((p) => {
                const discStr = p.sale && p.mrp ? Math.round((1 - p.sale / p.mrp) * 100) : 0;
                return (
                <article className="product-card" key={p.id}>
                  <Link href={`/product?id=${p.id}`} style={{ display: 'block' }}>
                    <div className="product-image-wrap">
                      <img src={getImageUrl((p.images && p.images.length > 0) ? (p.images.find((i:any) => i.is_primary)?.image_url || p.images[0].image_url) : '/images/product_placeholder.jpg', 'thumb')} alt={p.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
                      {discStr > 0 && <span className="product-discount-tag">-{discStr}%</span>}
                    </div>
                  </Link>
                  <div className="product-actions">
                    <button className="product-action-btn" aria-label="View Details" onClick={(e) => { e.preventDefault(); window.location.href = `/product?id=${p.id}`; }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                    <button className="product-action-btn" aria-label="Add to wishlist" onClick={(e) => handleToggleWishlist(e, p.id)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                    </button>
                  </div>
                  <div className="product-info">
                    <p className="product-brand">{p.category}</p>
                    <h3 className="product-name"><Link href={`/product?id=${p.id}`}>{p.name}</Link></h3>
                    <div className="product-rating">
                      <div className="stars">{Array.from({length:5}).map((_,i)=><svg key={i} viewBox="0 0 24 24" className={i>=5?'empty':''}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>)}</div>
                      <span className="rating-count">(0)</span>
                    </div>
                    <div className="product-pricing">
                      <span className="price-current">₹{p.sale || p.mrp}</span>
                      {p.sale && p.mrp && p.sale < p.mrp && <span className="price-original">₹{p.mrp}</span>}
                      {p.sale && p.mrp && p.sale < p.mrp && <span className="price-save">Save ₹{p.mrp - p.sale}</span>}
                    </div>
                    <button className="btn-add-cart" aria-label="Add to cart" onClick={(e) => handleAddToCart(e, p)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                      Add to Cart
                    </button>
                  </div>
                </article>
              )})}
            </div>

            {loading && page > 1 && (
                <div style={{ gridColumn: '1 / -1', padding: '20px', textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                  <div className="skeleton" style={{ width: '8px', height: '8px', borderRadius: '50%' }}></div>
                  <div className="skeleton" style={{ width: '8px', height: '8px', borderRadius: '50%', animationDelay: '0.2s' }}></div>
                  <div className="skeleton" style={{ width: '8px', height: '8px', borderRadius: '50%', animationDelay: '0.4s' }}></div>
                </div>
              )}
            
            <div ref={observerTarget} style={{ height: '20px', marginTop: '20px' }}></div>
            
            {!hasMore && products.length > 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>
                You've reached the end of the catalog!
              </div>
            )}
          </div>
        </div>
      </div>

      {quickViewProduct && (() => {
        const variants = quickViewProduct.variants || [];
        const colors = Array.from(new Set(variants.map((v:any) => v.color).filter(Boolean)));
        
        const availableSizes = colors.length > 0 
          ? variants.filter((v:any) => v.color === qvColor && v.size).map((v:any) => ({ size: v.size, stock: v.stock }))
          : variants.filter((v:any) => v.size).map((v:any) => ({ size: v.size, stock: v.stock }));
          
        const sizesList = availableSizes.length > 0 
          ? availableSizes 
          : (quickViewProduct.sizes ? quickViewProduct.sizes.split(',').map((s:string) => ({ size: s.trim(), stock: quickViewProduct.stock })) : []);

        let currentVariant = null;
        if (qvSize) {
          currentVariant = variants.find((v:any) => v.color === qvColor && v.size === qvSize) || variants.find((v:any) => v.size === qvSize);
        }

        const qvPrice = currentVariant?.sale_price || quickViewProduct.sale || quickViewProduct.mrp;
        const qvMrp = currentVariant?.price || quickViewProduct.mrp;
        
        // Find image for color
        const colorVariant = variants.find((v:any) => v.color === qvColor && v.image_url);
        let rawQvImage = (quickViewProduct.images && quickViewProduct.images.length > 0) ? (quickViewProduct.images.find((i:any) => i.is_primary)?.image_url || quickViewProduct.images[0].image_url) : '';
        if (colorVariant && colorVariant.image_url) {
          rawQvImage = colorVariant.image_url;
        }
        const qvImage = getImageUrl(rawQvImage, 'optimized');

        return (
          <Modal 
            isOpen={!!quickViewProduct} 
            onClose={() => setQuickViewProduct(null)} 
            title="Quick View" 
            size="lg"
            footer={
              <>
                <button className="btn btn-ghost" onClick={() => setQuickViewProduct(null)}>Close</button>
                <button className="btn btn-gold" onClick={(e) => { 
                  if (sizesList.length > 0 && !qvSize) {
                    toast.error('Please select a size');
                    return;
                  }
                  handleAddToCart(e as any, quickViewProduct); 
                  setQuickViewProduct(null); 
                }}>🛒 Add to Cart</button>
              </>
            }
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '30px' }}>
              <div>
                <img 
                  src={qvImage} 
                  alt={quickViewProduct.name} 
                  style={{ width: '100%', borderRadius: 'var(--radius-md)' }} 
                />
              </div>
              <div>
                <span className="badge b-info" style={{ marginBottom: '10px' }}>{quickViewProduct.category}</span>
                <h2 style={{ fontSize: '24px', margin: '10px 0', color: 'var(--text-heading)' }}>{quickViewProduct.name}</h2>
                <div style={{ fontSize: '24px', color: 'var(--gold)', fontWeight: 700, margin: '15px 0' }}>
                  ₹{qvPrice}
                  {qvPrice < qvMrp && <span style={{ fontSize: '16px', color: 'var(--muted)', textDecoration: 'line-through', marginLeft: '10px' }}>₹{qvMrp}</span>}
                </div>
                <p style={{ color: 'var(--text-body)', lineHeight: 1.6, marginBottom: '20px' }}>{quickViewProduct.description}</p>
                
                {colors.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <strong style={{ display: 'block', marginBottom: '8px' }}>Color: {qvColor}</strong>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {colors.map((c: any) => (
                        <button key={c} style={{ 
                          padding: '6px 12px', borderRadius: 'var(--radius-sm)',
                          border: qvColor === c ? '2px solid var(--primary)' : '1px solid var(--border)',
                          background: qvColor === c ? 'rgba(212,82,42,0.1)' : '#fff', cursor: 'pointer', fontWeight: 600
                        }} onClick={() => { setQvColor(c); setQvSize(''); }}>{c}</button>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ marginBottom: '20px' }}>
                  <strong style={{ display: 'block', marginBottom: '8px' }}>Available Sizes</strong>
                  <div className="size-grid">
                    {sizesList.map((sObj: any) => (
                      <button 
                        key={sObj.size} 
                        className={`size-btn${qvSize===sObj.size?' active':''}${sObj.stock <= 0 ?' oos':''}`} 
                        onClick={() => sObj.stock > 0 && setQvSize(sObj.size)} 
                        disabled={sObj.stock <= 0}
                      >
                        {sObj.size}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Modal>
        );
      })()}
    </main>
  );
}
