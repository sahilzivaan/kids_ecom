'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { fetchCustomerAuth, fetchPublic } from '@/utils/api';
import { getImageUrl } from '@/utils/image';
import { toast } from '@/utils/toast';

export default function WishlistPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchCustomerAuth('/wishlist')
      .then(res => res.json())
      .then(data => {
        if (data.products) setItems(data.products);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const removeItem = (id: number) => {
    fetchCustomerAuth('/wishlist/toggle', {
      method: 'POST',
      body: JSON.stringify({ product_id: id })
    })
    .then(res => res.json())
    .then(() => {
      setItems(prev => prev.filter(i => i.id !== id));
      window.dispatchEvent(new Event('wishlist_updated'));
    })
    .catch(console.error);
  };

  const moveToCart = async (item: any) => {
    try {
      const price = item.sale || item.mrp;
      const img = getImageUrl((item.images && item.images.length > 0) ? (item.images.find((i:any) => i.is_primary == 1 || i.is_primary === true)?.image_url || item.images[0].image_url) : '/images/product_placeholder.jpg', 'thumb');
      
      const res = await fetchCustomerAuth('/cart', {
        method: 'POST',
        body: JSON.stringify({
          product_id: item.id,
          name: item.name,
          meta: 'One Size',
          price: String(price),
          img: img,
          quantity: 1,
          variant_id: null
        })
      });
      const data = await res.json();
      if (data.message) {
        window.dispatchEvent(new Event('cart_updated'));
        toast.success(`Added ${item.name} to Cart`);
      } else {
        toast.error(data.error || 'Failed to move to cart');
      }
    } catch (err) {
      toast.error('An error occurred');
    }
  };

  const moveAllToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    setLoading(true);
    let successCount = 0;
    for (const item of items) {
      try {
        const price = item.sale || item.mrp;
        const img = getImageUrl((item.images && item.images.length > 0) ? (item.images.find((i:any) => i.is_primary == 1 || i.is_primary === true)?.image_url || item.images[0].image_url) : '/images/product_placeholder.jpg', 'thumb');
        
        const res = await fetchCustomerAuth('/cart', {
          method: 'POST',
          body: JSON.stringify({
            product_id: item.id,
            name: item.name,
            meta: 'One Size',
            price: String(price),
            img: img,
            quantity: 1,
            variant_id: null
          })
        });
        const data = await res.json();
        if (data.message) {
          successCount++;
        }
      } catch (err) {
        console.error(err);
      }
    }
    
    if (successCount > 0) {
      toast.success(`Added ${successCount} items to Cart`);
      window.dispatchEvent(new Event('cart_updated'));
      setLoading(false);
    } else {
      toast.error('Failed to move items to cart');
      setLoading(false);
    }
  };

  return (
    <main id="main-content">
      <style>{`
        .page-hero { background: linear-gradient(135deg, rgba(212,82,42,0.06) 0%, rgba(212,82,42,0.01) 100%); padding: 48px 0 36px; border-bottom: 1px solid rgba(212,82,42,0.1); }
        .page-hero h1 { font-family: var(--font-serif); font-size: clamp(28px,4vw,42px); color: var(--text-heading); margin-bottom: 8px; }
        .page-hero p { font-size: 15px; color: var(--text-muted); }
        .page-hero-actions { margin-top: 20px; display: flex; gap: 12px; }
        .wishlist-section { padding: 60px 0 80px; background: var(--bg); }
        .wishlist-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 24px; }
        .wishlist-card { background: #fff; border-radius: var(--radius-md); border: 1px solid var(--border); overflow: hidden; transition: var(--transition); position: relative; }
        .wishlist-card:hover { transform: translateY(-5px); box-shadow: var(--shadow-lg); border-color: transparent; }
        .w-img { position: relative; aspect-ratio: 3/2; background: var(--bg-subtle); overflow: hidden; }
        .w-img img { width: 100%; height: 100%; object-fit: contain; transition: transform 0.5s var(--ease); }
        .wishlist-card:hover .w-img img { transform: scale(1.05); }
        .w-badge { position: absolute; top: 12px; left: 12px; background: var(--primary); color: #fff; font-size: 10px; font-weight: 700; letter-spacing: 0.5px; padding: 4px 10px; border-radius: var(--radius-full); }
        .btn-remove-wish { position: absolute; top: 10px; right: 10px; width: 34px; height: 34px; border-radius: 50%; background: rgba(255,255,255,0.92); border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: var(--shadow-sm); color: var(--text-muted); transition: var(--transition); }
        .btn-remove-wish:hover { background: var(--primary); color: #fff; }
        .btn-remove-wish svg { width: 15px; height: 15px; }
        .w-info { padding: 16px; }
        .w-brand { font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: var(--text-muted); margin-bottom: 5px; }
        .w-name { font-size: 14px; font-weight: 500; color: var(--text-heading); line-height: 1.4; margin-bottom: 10px; }
        .w-pricing { display: flex; align-items: baseline; gap: 8px; margin-bottom: 14px; }
        .w-price-now { font-size: 18px; font-weight: 700; color: var(--text-heading); font-family: var(--font-serif); }
        .w-price-old { font-size: 13px; color: var(--text-light); text-decoration: line-through; }
        .w-price-save { font-size: 11px; font-weight: 600; color: #27AE60; }
        .btn-move-cart { width: 100%; padding: 11px; border-radius: var(--radius-sm); background: var(--accent); color: #fff; font-size: 13px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 8px; transition: var(--transition); border: none; cursor: pointer; }
        .btn-move-cart:hover { background: var(--primary); }
        .btn-move-cart svg { width: 16px; height: 16px; }
        @media (max-width: 1100px) { .wishlist-grid { grid-template-columns: repeat(3,1fr); } }
        @media (max-width: 768px) {
          .wishlist-grid { grid-template-columns: repeat(2,1fr); gap: 16px; }
          .page-hero { padding: 36px 0 28px; }
          .page-hero-actions { flex-direction: row; align-items: center; gap: 10px; }
          .wishlist-section { padding: 40px 0 60px; }
        }
        @media (max-width: 480px) {
          .wishlist-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
          .w-info { padding: 10px 8px; }
          .w-name { font-size: 12.5px; }
          .w-price-now { font-size: 15px; }
          .btn-move-cart { font-size: 11.5px; padding: 9px 6px; }
          .page-hero h1 { font-size: clamp(22px, 7vw, 36px); }
          .page-hero-actions { flex-direction: column; align-items: stretch; gap: 10px; }
          .page-hero-actions > * { justify-content: center !important; text-align: center; }
        }
        @media (max-width: 360px) {
          .wishlist-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <section className="page-hero">
        <div className="container">
          <span className="section-label">Your Saved Items</span>
          <h1>My Wishlist</h1>
          <p>{loading ? 'Loading...' : `${items.length} items saved — add them to your cart before they sell out!`}</p>
          <div className="page-hero-actions">
            <button onClick={moveAllToCart} className="btn-primary accent-btn" style={{ border: 'none', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
              Add All to Cart
            </button>
            <Link href="/shop" className="btn-outline">Continue Shopping</Link>
          </div>
        </div>
      </section>

      <section className="wishlist-section">
        <div className="container">
          {loading ? (
            <div className="wishlist-grid">
              {Array.from({ length: 4 }).map((_, i) => (
                <article key={`w-sk-${i}`} className="wishlist-card">
                  <div className="w-img skeleton"></div>
                  <div className="w-info">
                    <div className="skeleton skeleton-text" style={{ width: '40%' }}></div>
                    <div className="skeleton skeleton-text" style={{ width: '80%', height: '18px', marginBottom: '12px' }}></div>
                    <div className="skeleton skeleton-text" style={{ width: '50%' }}></div>
                    <div className="skeleton" style={{ width: '100%', height: '44px', marginTop: '16px', borderRadius: '4px' }}></div>
                  </div>
                </article>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.15, margin: '0 auto 24px', display: 'block' }}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', marginBottom: '12px' }}>Your wishlist is empty</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Save items you love and buy them later.</p>
              <Link href="/shop" className="btn-primary accent-btn">Start Shopping</Link>
            </div>
          ) : (
            <div className="wishlist-grid">
              {items.map(item => {
              const discount = item.mrp && item.sale && item.mrp > item.sale ? Math.round((1 - item.sale / item.mrp) * 100) : 0;
              return (
                <article key={item.id} className="wishlist-card">
                  <div className="w-img">
                    <Link href={`/product?id=${item.id}`} style={{ display: 'block', width: '100%', height: '100%' }}>
                      {item.images && item.images.length > 0 ? (
                        <img src={getImageUrl((item.images.find((i:any) => i.is_primary == 1 || i.is_primary === true)?.image_url) || item.images[0].image_url, 'thumb')} alt={item.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      ) : (
                        <img src="/images/product_placeholder.jpg" alt={item.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      )}
                    </Link>
                    {discount > 0 && <span className="w-badge">-{discount}%</span>}
                    <button className="btn-remove-wish" aria-label="Remove from wishlist" onClick={() => removeItem(item.id)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                    </button>
                  </div>
                  <div className="w-info">
                    <p className="w-brand">{item.category || 'Chhotu Fashion'}</p>
                    <p className="w-name"><Link href={`/product?id=${item.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>{item.name}</Link></p>
                    <div className="w-pricing">
                      <span className="w-price-now">₹{item.sale || item.mrp}</span>
                      {item.sale && item.mrp && item.sale < item.mrp && <span className="w-price-old">₹{item.mrp}</span>}
                      {discount > 0 && <span className="w-price-save">Save ₹{item.mrp - item.sale}</span>}
                    </div>
                    <button className="btn-move-cart" onClick={() => moveToCart(item)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                      Add to Cart
                    </button>
                  </div>
                </article>
              );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
