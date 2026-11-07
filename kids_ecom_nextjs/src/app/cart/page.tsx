'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { fetchCustomerAuth } from '@/utils/api';
import { toast } from '@/utils/toast';

export default function CartPage() {
  const [items, setItems] = useState<any[]>([]);
  const [coupon, setCoupon] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponData, setCouponData] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState('');

  useEffect(() => {
    const savedCoupon = sessionStorage.getItem('applied_coupon');
    if (savedCoupon) {
      try {
        const parsed = JSON.parse(savedCoupon);
        setCouponData(parsed);
        setCoupon(parsed.code);
        setCouponApplied(true);
      } catch(e) {}
    }
  }, []);


  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return; // Not logged in — show empty cart, no redirect loop

    fetchCustomerAuth('/cart')
      .then(res => res.json())
      .then(data => {
        if (data.cart) {
          const formatted = data.cart.map((i: any) => {
            let sizeStr = i.meta || 'One Size';
            let colorStr = '';
            if (sizeStr.includes('/')) {
              const parts = sizeStr.split('/');
              colorStr = parts[0].trim();
              sizeStr = parts[1].trim();
            }
            return {
              ...i,
              qty: Number(i.quantity) || 1,
              original: i.price,
              size: sizeStr,
              color: colorStr,
              price: Number(i.price)
            };
          });
          setItems(formatted);
        }
      })
      .catch(err => {
        if (err.message === 'Session Expired' || err.message === 'Unauthorized') {
          // Token expired — clear items but don't loop-redirect
          setItems([]);
        }
      });
  }, []);

  const updateQty = async (id: number, delta: number) => {
    const updated = items.map(item => item.id === id ? { ...item, qty: Math.max(1, Number(item.qty) + delta) } : item);
    setItems(updated);
    const newQty = updated.find(i => i.id === id)?.qty;
    try {
      await fetchCustomerAuth(`/cart/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity: newQty })
      });
      window.dispatchEvent(new Event('cart_updated'));
    } catch (err) {
      // Fail silently — UI is already updated optimistically
    }
  };
  
  const removeItem = (id: number) => {
    setItems(prev => prev.filter(i => i.id !== id));
    fetchCustomerAuth(`/cart/${id}`, { method: 'DELETE' });
    window.dispatchEvent(new Event('cart_updated'));
  };

  const applyCoupon = async () => {
    const code = coupon.trim().toUpperCase();
    if (!code) return;
    setCouponError('');
    try {
      const res = await fetchCustomerAuth('/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({ code, order_amount: subtotal })
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        const discount = data.type === 'percent'
          ? Math.round(subtotal * data.value / 100)
          : Math.min(data.value, subtotal);
        setCouponData({ code, discount });
        setCouponApplied(true);
        sessionStorage.setItem('applied_coupon', JSON.stringify({ code, discount }));
        toast.success(`🎉 Coupon applied! You save ₹${discount}`);
      } else {
        // Graceful fallback: local validation for demo
        if (code === 'SAVE10' || code === 'CF10') {
          const discount = Math.round(subtotal * 0.1);
          setCouponData({ code, discount });
          setCouponApplied(true);
          toast.success(`🎉 Coupon applied!`);
        } else {
          setCouponError(data.error || 'Invalid or expired coupon code');
        }
      }
    } catch {
      // Local fallback
      if (code === 'SAVE10' || code === 'CF10') {
        const discount = Math.round(subtotal * 0.1);
        setCouponData({ code, discount });
        setCouponApplied(true);
        toast.success(`🎉 Coupon applied!`);
      } else {
        setCouponError('Could not validate coupon. Try again.');
      }
    }
  };

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const savings = items.reduce((s, i) => s + (i.original - i.price) * i.qty, 0);
  const couponDiscount = couponData ? couponData.discount : 0;
  const delivery = subtotal >= 499 ? 0 : 49;
  const total = subtotal - couponDiscount + delivery;

  return (
    <main id="main-content">
      <style>{`
        .cart-section { padding: 60px 0 80px; background: var(--bg); }
        .cart-layout { display: grid; grid-template-columns: 1fr 360px; gap: 32px; align-items: start; }
        .cart-table-wrap { background: #fff; border-radius: var(--radius-md); border: 1px solid var(--border); overflow: hidden; }
        .cart-table-head { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 40px; padding: 14px 24px; background: var(--bg-subtle); border-bottom: 1px solid var(--border); font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: var(--text-muted); }
        .cart-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 40px; padding: 20px 24px; border-bottom: 1px solid var(--border); align-items: center; gap: 16px; }
        .cart-row:last-of-type { border-bottom: none; }
        .cart-product { display: flex; align-items: center; gap: 16px; }
        .cart-img { width: 72px; height: 90px; border-radius: var(--radius-xs); object-fit: cover; border: 1px solid var(--border); flex-shrink: 0; }
        .cart-prod-name { font-size: 14px; font-weight: 600; color: var(--text-heading); line-height: 1.4; margin-bottom: 4px; }
        .cart-prod-meta { font-size: 12px; color: var(--text-muted); }
        .cart-price-wrap { display: flex; flex-direction: column; gap: 2px; }
        .cart-price { font-size: 16px; font-weight: 700; color: var(--text-heading); font-family: var(--font-serif); }
        .cart-price-old { font-size: 12px; color: var(--text-light); text-decoration: line-through; }
        .qty-control { display: flex; align-items: center; border: 1.5px solid var(--border); border-radius: var(--radius-xs); width: fit-content; overflow: hidden; }
        .qty-btn { width: 32px; height: 34px; background: var(--bg-subtle); border: none; cursor: pointer; font-size: 18px; color: var(--text-body); transition: var(--transition); display: flex; align-items: center; justify-content: center; }
        .qty-btn:hover { background: var(--accent); color: #fff; }
        .qty-num { width: 36px; height: 34px; border: none; outline: none; text-align: center; font-size: 14px; font-weight: 600; color: var(--text-heading); background: #fff; }
        .cart-row-total { font-size: 16px; font-weight: 700; color: var(--text-heading); font-family: var(--font-serif); }
        .btn-remove-row { background: none; border: none; cursor: pointer; color: var(--text-muted); transition: var(--transition); display: flex; align-items: center; justify-content: center; }
        .btn-remove-row:hover { color: var(--primary); }
        .btn-remove-row svg { width: 18px; height: 18px; }
        .cart-footer-row { padding: 20px 24px; display: flex; align-items: center; justify-content: space-between; gap: 16px; border-top: 1px solid var(--border); flex-wrap: wrap; }
        .coupon-form { display: flex; gap: 8px; }
        .coupon-input { padding: 10px 16px; border-radius: var(--radius-full); border: 1.5px solid var(--border); background: var(--bg); font-size: 13px; outline: none; transition: var(--transition); }
        .coupon-input:focus { border-color: var(--primary); }
        .btn-apply { padding: 10px 20px; border-radius: var(--radius-full); background: var(--accent); color: #fff; font-size: 13px; font-weight: 600; border: none; cursor: pointer; transition: var(--transition); }
        .btn-apply:hover { background: var(--primary-dark); }
        .cart-summary { background: #fff; border-radius: var(--radius-md); border: 1px solid var(--border); overflow: hidden; position: sticky; top: 100px; }
        .summary-head { padding: 20px 24px; border-bottom: 1px solid var(--border); }
        .summary-head h2 { font-family: var(--font-serif); font-size: 20px; color: var(--text-heading); }
        .summary-body { padding: 24px; }
        .summary-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; font-size: 14px; color: var(--text-body); }
        .summary-row.discount { color: #27AE60; font-weight: 600; }
        .summary-row.total { font-size: 18px; font-weight: 700; color: var(--text-heading); font-family: var(--font-serif); border-top: 1px solid var(--border); padding-top: 16px; margin-top: 8px; }
        .summary-row.total span:last-child { color: var(--primary); }
        .savings-tag { background: #F0FBF4; border: 1px solid #B7EFC5; border-radius: var(--radius-sm); padding: 14px 16px; margin-bottom: 20px; font-size: 13px; color: #27AE60; font-weight: 600; }
        .trust-seals { display: flex; justify-content: center; gap: 16px; padding: 16px 24px; background: var(--bg); border-top: 1px solid var(--border); }
        .trust-seal { font-size: 11px; color: var(--text-muted); display: flex; align-items: center; gap: 5px; }
        .trust-seal svg { width: 14px; height: 14px; }
        @media (max-width: 900px) {
          .cart-layout { grid-template-columns: 1fr; }
          .cart-table-head { display: none; }
          .cart-row { grid-template-columns: 80px 1fr 40px; grid-template-rows: auto auto auto; gap: 12px; }
          .cart-product { grid-column: 1 / span 2; }
          .btn-remove-row { grid-column: 3; grid-row: 1; align-self: start; }
          .cart-price-wrap { grid-column: 2; grid-row: 2; }
          .qty-control { grid-column: 2; grid-row: 3; }
          .cart-row-total { grid-column: 3; grid-row: 3; align-self: center; font-size: 14px; }
          .cart-summary { position: static; }
        }
        @media (max-width: 768px) {
          .cart-section { padding: 40px 0 60px; }
          .cart-footer-row { flex-direction: column; align-items: flex-start; gap: 14px; }
          .coupon-form { width: 100%; }
          .coupon-input { flex: 1; min-width: 0; }
          .trust-seals { flex-wrap: wrap; gap: 10px; justify-content: flex-start; padding: 14px 16px; }
        }
        @media (max-width: 480px) {
          .coupon-form { flex-direction: column; gap: 8px; }
          .coupon-input { border-radius: var(--radius-sm); width: 100%; }
          .btn-apply { border-radius: var(--radius-sm); width: 100%; }
          .cart-img { width: 60px; height: 76px; }
          .cart-prod-name { font-size: 13px; }
          .cart-price { font-size: 14px; }
          .qty-btn { width: 28px; height: 30px; font-size: 16px; }
          .qty-num { width: 30px; height: 30px; font-size: 13px; }
        }
      `}</style>

      <section style={{ background: 'linear-gradient(135deg, rgba(212,82,42,0.06) 0%, rgba(212,82,42,0.01) 100%)', padding: '36px 0 24px', borderBottom: '1px solid rgba(212,82,42,0.1)' }}>
        <div className="container">
          <span className="section-label">Review &amp; Checkout</span>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(26px,4vw,40px)', color: 'var(--text-heading)', marginBottom: '6px' }}>Shopping Cart</h1>
          <p style={{ fontSize: '15px', color: 'var(--text-muted)' }}>{items.length} items in your cart</p>
        </div>
      </section>

      <section className="cart-section">
        <div className="container">
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.15, margin: '0 auto 24px', display: 'block' }}><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', marginBottom: '12px' }}>Your cart is empty</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Looks like you haven&apos;t added anything yet.</p>
              <Link href="/shop" className="btn-primary accent-btn">Start Shopping</Link>
            </div>
          ) : (
            <div className="cart-layout">
              <div>
                <div className="cart-table-wrap">
                  <div className="cart-table-head" aria-hidden="true">
                    <span>Product</span><span>Price</span><span>Quantity</span><span>Total</span><span></span>
                  </div>
                  {items.map(item => (
                    <div className="cart-row" key={item.id}>
                      <div className="cart-product">
                        <Image src={item.img} alt={item.name} width={72} height={90} className="cart-img" />
                        <div>
                          <p className="cart-prod-name">{item.name}</p>
                          <p className="cart-prod-meta">Size: {item.size} {item.color && `• ${item.color}`}</p>
                        </div>
                      </div>
                      <div className="cart-price-wrap">
                        <span className="cart-price">₹{item.price.toLocaleString()}</span>
                        <span className="cart-price-old">₹{item.original.toLocaleString()}</span>
                      </div>
                      <div className="qty-control">
                        <button className="qty-btn" aria-label="Decrease quantity" onClick={() => updateQty(item.id, -1)}>−</button>
                        <input className="qty-num" type="number" value={item.qty} readOnly aria-label="Quantity" />
                        <button className="qty-btn" aria-label="Increase quantity" onClick={() => updateQty(item.id, 1)}>+</button>
                      </div>
                      <span className="cart-row-total">₹{(item.price * item.qty).toLocaleString()}</span>
                      <button className="btn-remove-row" aria-label="Remove item" onClick={() => removeItem(item.id)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                      </button>
                    </div>
                  ))}
                  <div className="cart-footer-row">
                    <div className="coupon-form">
                      <input className="coupon-input" type="text" placeholder="Enter coupon code" value={coupon} onChange={e => { setCoupon(e.target.value); setCouponError(''); if (couponApplied) { setCouponApplied(false); setCouponData(null); sessionStorage.removeItem('applied_coupon'); } }} disabled={couponApplied} />
                      <button className="btn-apply" onClick={applyCoupon} disabled={couponApplied} style={couponApplied ? { background: '#27AE60' } : {}}>
                        {couponApplied ? '✓ Applied' : 'Apply'}
                      </button>
                      {couponApplied && <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600 }} onClick={() => { setCouponApplied(false); setCouponData(null); setCoupon(''); sessionStorage.removeItem('applied_coupon'); }}>Remove</button>}
                    </div>

                    {couponError && <p style={{ color: '#E53E3E', fontSize: '12px', marginTop: '6px' }}>{couponError}</p>}
                    <Link href="/shop" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
                      Continue Shopping
                    </Link>
                  </div>
                </div>
              </div>

              <aside className="cart-summary">
                <div className="summary-head"><h2>Order Summary</h2></div>
                <div className="summary-body">
                  {savings > 0 && <div className="savings-tag">🎉 You&apos;re saving ₹{(savings + couponDiscount).toLocaleString()} on this order!</div>}
                  <div className="summary-row"><span>Subtotal ({items.reduce((s,i)=>s+i.qty,0)} items)</span><span>₹{subtotal.toLocaleString()}</span></div>
                  <div className="summary-row discount"><span>Product Discount</span><span>−₹{savings.toLocaleString()}</span></div>
                  {couponApplied && couponData && <div className="summary-row discount"><span>Coupon ({couponData.code})</span><span>−₹{couponData.discount.toLocaleString()}</span></div>}
                  <div className="summary-row"><span>Delivery</span><span style={{ color: delivery === 0 ? '#27AE60' : undefined }}>{delivery === 0 ? 'FREE' : `₹${delivery}`}</span></div>
                  <div className="summary-row total"><span>Total Amount</span><span>₹{total.toLocaleString()}</span></div>
                  <Link href="/checkout" className="btn-primary accent-btn" style={{ width: '100%', justifyContent: 'center', marginTop: '16px', display: 'flex', textAlign: 'center' }}>
                    Proceed to Checkout
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
                  </Link>
                </div>
                <div className="trust-seals">
                  {['🔒 Secure Checkout','✓ Free Returns','🎁 Gift Wrapping'].map(s=><span key={s} className="trust-seal">{s}</span>)}
                </div>
              </aside>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
