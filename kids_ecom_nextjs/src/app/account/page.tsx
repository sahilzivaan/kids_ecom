'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { fetchCustomerAuth } from '@/utils/api';
import { formatDate } from '@/utils/date';
import { getImageUrl } from '@/utils/image';

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState('orders');
  const [saved, setSaved] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [orders, setOrders] = useState<any[]>([]);
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Address edit state
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({ line1: '', line2: '', city: '', state: '', pin: '' });

  // Settings state
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [emailPromos, setEmailPromos] = useState(true);
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passForm, setPassForm] = useState({ oldPass: '', newPass: '' });
  const [passMsg, setPassMsg] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/signin';
  };

  const tabs = [
    { id: 'orders', label: 'My Orders', icon: <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>, icon2: <line x1="3" y1="6" x2="21" y2="6"/> },
    { id: 'profile', label: 'Profile', icon: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></> },
    { id: 'addresses', label: 'Addresses', icon: <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></> },
    { id: 'wishlist', label: 'Wishlist', icon: <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/> },
    { id: 'settings', label: 'Settings', icon: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></> },
  ];

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (userStr && token) {
      const parsedUser = JSON.parse(userStr);
      setUser(parsedUser);
      setEmailUpdates(parsedUser.email_order_updates !== 0);
      setEmailPromos(parsedUser.email_promotions !== 0);
      setAddressForm({
        line1: parsedUser.address_line1 || '', line2: parsedUser.address_line2 || '',
        city: parsedUser.city || '', state: parsedUser.state || '', pin: parsedUser.pincode || ''
      });
      
      Promise.allSettled([
        fetchCustomerAuth('/auth/me').then(res => res.json()).then(data => {
          if (data.user) {
            setUser(data.user);
            localStorage.setItem('user', JSON.stringify(data.user));
            setEmailUpdates(data.user.email_order_updates !== 0);
            setEmailPromos(data.user.email_promotions !== 0);
            setAddressForm({
              line1: data.user.address_line1 || '', line2: data.user.address_line2 || '',
              city: data.user.city || '', state: data.user.state || '', pin: data.user.pincode || ''
            });
          }
        }),
        fetchCustomerAuth('/orders').then(res => res.json()).then(data => {
          if (data.orders) setOrders(data.orders);
        }),
        fetchCustomerAuth('/wishlist').then(res => res.json()).then(data => {
          if (data.products) setWishlistItems(data.products);
        })
      ]).finally(() => {
        setLoading(false);
      });
    } else {
      window.location.href = '/signin';
    }
  }, []);

  const totalOrders = orders.length;
  const totalSpent = orders.reduce((acc, order) => {
    const amtStr = String(order.total_amount || '0').replace(/[^0-9]/g, '');
    return acc + (parseInt(amtStr, 10) || 0);
  }, 0);
  const formattedSpent = '₹' + totalSpent.toLocaleString('en-IN');
  const wishlistCount = wishlistItems.length;

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchCustomerAuth('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({
           first_name: user.first_name, last_name: user.last_name, phone: user.phone,
           address_line1: addressForm.line1, address_line2: addressForm.line2,
           city: addressForm.city, state: addressForm.state, pincode: addressForm.pin
        })
      });
      if (res.ok) {
        setUser({ ...user, address_line1: addressForm.line1, address_line2: addressForm.line2, city: addressForm.city, state: addressForm.state, pincode: addressForm.pin });
        setIsEditingAddress(false);
      }
    } catch(err) {
      console.error(err);
    }
  };

  const handleToggleSettings = async (field: string, val: boolean) => {
    const isUpdates = field === 'updates';
    const newUpdates = isUpdates ? val : emailUpdates;
    const newPromos = !isUpdates ? val : emailPromos;
    if (isUpdates) setEmailUpdates(val); else setEmailPromos(val);
    
    try {
      await fetchCustomerAuth('/auth/settings', {
        method: 'PUT',
        body: JSON.stringify({ email_order_updates: newUpdates, email_promotions: newPromos })
      });
      setUser({ ...user, email_order_updates: newUpdates ? 1 : 0, email_promotions: newPromos ? 1 : 0 });
    } catch(err) {
      console.error(err);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg('Updating...');
    try {
      const res = await fetchCustomerAuth('/auth/password', {
        method: 'PUT', body: JSON.stringify({ current_password: passForm.oldPass, new_password: passForm.newPass })
      });
      const data = await res.json();
      if (!res.ok) setPassMsg(data.error || data.messages?.error || 'Failed to update password');
      else {
        setPassMsg('Password updated successfully!');
        setPassForm({ oldPass: '', newPass: '' });
        setTimeout(() => { setIsChangingPass(false); setPassMsg(''); }, 2000);
      }
    } catch(err) { setPassMsg('Error updating password'); }
  };

  const handleDeleteAccount = async () => {
    if (confirm("Are you absolutely sure you want to permanently delete your account? This action cannot be undone.")) {
      try {
        await fetchCustomerAuth('/auth/account', { method: 'DELETE' });
        handleSignOut();
      } catch(err) { alert('Failed to delete account'); }
    }
  };

  return (
    <main id="main-content">
      <style>{`
        .account-section { padding: 60px 0 80px; background: var(--bg); min-height: 85vh; }
        .account-layout { display: grid; grid-template-columns: 260px 1fr; gap: 28px; align-items: start; }
        .account-sidebar { background: #fff; border-radius: var(--radius-md); border: 1px solid var(--border); overflow: hidden; position: sticky; top: 100px; }
        .account-profile-box { padding: 28px 24px; background: var(--accent); display: flex; flex-direction: column; align-items: center; text-align: center; }
        .profile-avatar { width: 72px; height: 72px; border-radius: 50%; background: var(--primary); color: #fff; display: flex; align-items: center; justify-content: center; font-family: var(--font-serif); font-size: 28px; font-weight: 700; margin-bottom: 12px; border: 3px solid rgba(255,255,255,0.2); }
        .profile-name { font-size: 16px; font-weight: 700; color: #fff; margin-bottom: 2px; }
        .profile-email { font-size: 12px; color: rgba(255,255,255,0.5); }
        .sidebar-nav { padding: 8px 0; }
        .sidebar-link { display: flex; align-items: center; gap: 12px; padding: 13px 24px; font-size: 14px; font-weight: 500; color: var(--text-body); transition: var(--transition); cursor: pointer; border-left: 3px solid transparent; border: none; background: none; width: 100%; text-align: left; }
        .sidebar-link:hover { background: var(--bg); color: var(--text-heading); }
        .sidebar-link.active { background: var(--primary-light); color: var(--primary); border-left-color: var(--primary); font-weight: 600; }
        .sidebar-link svg { width: 18px; height: 18px; flex-shrink: 0; }
        .sidebar-divider { border: none; border-top: 1px solid var(--border); margin: 6px 0; }
        .account-main { display: flex; flex-direction: column; gap: 24px; }
        .account-card { background: #fff; border-radius: var(--radius-md); border: 1px solid var(--border); overflow: hidden; }
        .account-card-head { padding: 20px 24px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
        .account-card-head h2 { font-family: var(--font-serif); font-size: 20px; color: var(--text-heading); }
        .account-card-body { padding: 24px; }
        .account-card-footer { padding: 16px 24px; background: var(--bg); border-top: 1px solid var(--border); display: flex; justify-content: flex-end; align-items: center; }
        .stats-row { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; }
        .stat-box { background: var(--bg-subtle); border-radius: var(--radius-sm); padding: 20px 16px; text-align: center; }
        .stat-box-val { font-family: var(--font-serif); font-size: 28px; font-weight: 700; color: var(--text-heading); }
        .stat-box-lbl { font-size: 12px; color: var(--text-muted); margin-top: 4px; font-weight: 500; }
        .orders-list { display: flex; flex-direction: column; gap: 0; }
        .order-row { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr auto; padding: 16px 0; border-bottom: 1px solid var(--border); gap: 16px; align-items: center; }
        .order-row:last-child { border-bottom: none; }
        .order-row-head { font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: var(--text-muted); padding-bottom: 12px; border-bottom: 1px solid var(--border); }
        .order-id { font-size: 14px; font-weight: 700; color: var(--text-heading); font-family: var(--font-serif); }
        .order-date { font-size: 13px; color: var(--text-muted); }
        .order-amount { font-size: 14px; font-weight: 700; color: var(--text-heading); }
        .order-status { display: inline-flex; align-items: center; gap: 5px; padding: 4px 12px; border-radius: var(--radius-full); font-size: 11px; font-weight: 700; letter-spacing: 0.5px; }
        .status-delivered { background: #F0FBF4; color: #27AE60; }
        .status-shipped   { background: #EEF4FF; color: #3B82F6; }
        .status-pending   { background: #FFF8EE; color: #F59E0B; }
        .btn-track { padding: 7px 16px; border-radius: var(--radius-full); border: 1.5px solid var(--border); font-size: 12px; font-weight: 600; color: var(--text-body); background: none; cursor: pointer; transition: var(--transition); text-decoration: none; }
        .btn-track:hover { border-color: var(--accent); color: var(--accent); }
        .profile-form { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
        .form-field { display: flex; flex-direction: column; gap: 6px; }
        .form-field.full { grid-column: 1 / -1; }
        .form-field label { font-size: 12px; font-weight: 600; color: var(--text-muted); letter-spacing: 0.5px; text-transform: uppercase; }
        .form-field input, .form-field select { padding: 11px 16px; border: 1.5px solid var(--border); border-radius: var(--radius-sm); font-size: 14px; color: var(--text-heading); background: var(--bg); outline: none; transition: var(--transition); }
        .form-field input:focus, .form-field select:focus { border-color: var(--primary); background: #fff; box-shadow: 0 0 0 3px rgba(212,82,42,0.08); }
        .btn-save { padding: 12px 28px; border-radius: var(--radius-full); background: var(--accent); color: #fff; font-size: 14px; font-weight: 600; border: none; cursor: pointer; transition: var(--transition); }
        .btn-save:hover { background: var(--primary); }
        .skeleton { background: linear-gradient(90deg, #f8f8f8 25%, #ececec 50%, #f8f8f8 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 4px; }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        
        /* Modern Toggle Switch */
        .switch { position: relative; display: inline-block; width: 44px; height: 24px; flex-shrink: 0; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #cbd5e1; transition: .4s; border-radius: 24px; }
        .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .3s; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
        input:checked + .slider { background-color: var(--primary); }
        input:checked + .slider:before { transform: translateX(20px); }
        
        .settings-row { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; background: #fff; border: 1.5px solid var(--border); border-radius: var(--radius-md); margin-bottom: 12px; transition: var(--transition); }
        .settings-row:hover { border-color: #cbd5e1; box-shadow: var(--shadow-sm); }
        .settings-label { display: flex; flex-direction: column; gap: 4px; }
        .settings-title { font-size: 15px; font-weight: 700; color: var(--text-heading); }
        .settings-desc { font-size: 13px; color: var(--text-muted); }
        .settings-section-title { font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; margin: 24px 0 12px; }

        @media (max-width: 900px) {
          .account-layout { grid-template-columns: 1fr; }
          .account-sidebar { position: static; }
          .sidebar-nav { display: flex; justify-content: space-between; border-bottom: 1px solid var(--border); padding: 0; width: 100%; }
          .sidebar-link { border-left: none !important; border-bottom: 3px solid transparent; padding: 14px 8px; gap: 0; justify-content: center; width: auto; flex: none; }
          .sidebar-link .tab-label { max-width: 0; opacity: 0; overflow: hidden; transition: all 0.35s ease; display: inline-block; vertical-align: middle; }
          .sidebar-link.active .tab-label { max-width: 150px; opacity: 1; margin-left: 8px; }
          .sidebar-link.active { border-bottom-color: var(--primary) !important; background: transparent; }
          .sidebar-divider { display: none; }
          .account-section { padding: 40px 0 60px; }
        }
        @media (max-width: 768px) {
          .stats-row { grid-template-columns: 1fr 1fr; gap: 12px; }
          .stat-box-val { font-size: 22px; }
          .order-row { grid-template-columns: 1fr 1fr; gap: 10px; }
          .order-row-head { display: none; }
          .profile-form { grid-template-columns: 1fr; }
          .form-field.full { grid-column: 1; }
          .account-card-body { padding: 18px; }
          .account-card-head { padding: 16px 18px; }
          .account-card-footer { padding: 14px 18px; }
        }
        @media (max-width: 600px) {
          .stats-row { grid-template-columns: 1fr 1fr; }
          .order-row { grid-template-columns: 1fr; }
          .profile-form { grid-template-columns: 1fr; }
          .form-field.full { grid-column: 1; }
        }
        @media (max-width: 480px) {
          .account-profile-box { padding: 20px 16px; }
          .profile-avatar { width: 60px; height: 60px; font-size: 22px; }
          .stats-row { grid-template-columns: 1fr 1fr; gap: 10px; }
          .stat-box { padding: 14px 10px; }
          .stat-box-val { font-size: 20px; }
          .order-row { grid-template-columns: 1fr; }
          .settings-row { flex-direction: column; align-items: flex-start; gap: 12px; }
        }
      `}</style>

      <section style={{ background: 'linear-gradient(135deg, rgba(212,82,42,0.06) 0%, rgba(212,82,42,0.01) 100%)', padding: '40px 0 28px', borderBottom: '1px solid rgba(212,82,42,0.1)' }}>
        <div className="container">
          <span className="section-label">Dashboard</span>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(26px,4vw,40px)', color: 'var(--text-heading)', marginBottom: '6px' }}>My Account</h1>
          <p style={{ fontSize: '15px', color: 'var(--text-muted)' }}>Welcome back, {user?.first_name || user?.username || 'Guest'}! Manage your orders, wishlist & profile.</p>
        </div>
      </section>

      <section className="account-section">
        <div className="container">
          <div className="account-layout">
            {/* Sidebar */}
            <aside className="account-sidebar">
              <div className="account-profile-box">
                <div className="profile-avatar">{(user?.username || 'U').charAt(0).toUpperCase()}</div>
                <div className="profile-name">{user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.username || 'User'}</div>
                <div className="profile-email">{user?.email || 'email@example.com'}</div>
              </div>
              <nav className="sidebar-nav">
                {tabs.map(t => (
                  <button key={t.id} className={`sidebar-link${activeTab===t.id?' active':''}`} onClick={() => setActiveTab(t.id)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{t.icon}{t.icon2}</svg>
                    <span className="tab-label">{t.label}</span>
                  </button>
                ))}
                <hr className="sidebar-divider" />
                <button onClick={handleSignOut} className="sidebar-link" style={{ color: 'var(--primary)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  <span className="tab-label">Sign Out</span>
                </button>
              </nav>
            </aside>

            {/* Main */}
            <main className="account-main">
              {/* Stats */}
              <div className="account-card">
                <div className="account-card-body">
                  <div className="stats-row">
                    {loading ? (
                      [1, 2, 3, 4].map((i) => (
                        <div key={i} className="stat-box" style={{ padding: '30px' }}>
                          <div className="skeleton" style={{ width: '60px', height: '32px', margin: '0 auto 8px', borderRadius: '8px' }}></div>
                          <div className="skeleton" style={{ width: '80px', height: '16px', margin: '0 auto', borderRadius: '4px' }}></div>
                        </div>
                      ))
                    ) : (
                      [[`${totalOrders}`,'Total Orders'],[`${wishlistCount}`,'Wishlisted'],[`${formattedSpent}`,'Total Spent'],['0.0','Avg Rating']].map(([v,l])=>(
                        <div key={l} className="stat-box"><div className="stat-box-val">{v}</div><div className="stat-box-lbl">{l}</div></div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Orders */}
              {activeTab === 'orders' && (
                <div className="account-card">
                  <div className="account-card-head"><h2>Recent Orders</h2></div>
                  <div className="account-card-body">
                    <div className="orders-list">
                      <div className="order-row order-row-head" aria-hidden="true">
                        <span>Order ID</span><span>Date</span><span>Amount</span><span>Status</span><span>Action</span>
                      </div>
                      {loading ? (
                        [1, 2, 3].map((i) => (
                          <div key={i} className="order-row" style={{ padding: '20px', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
                            <div className="skeleton" style={{ width: '80px', height: '20px' }}></div>
                            <div className="skeleton" style={{ width: '100px', height: '20px' }}></div>
                            <div className="skeleton" style={{ width: '60px', height: '20px' }}></div>
                            <div className="skeleton" style={{ width: '70px', height: '24px', borderRadius: '12px' }}></div>
                            <div className="skeleton" style={{ width: '80px', height: '32px', borderRadius: '30px', margin: '0 auto' }}></div>
                          </div>
                        ))
                      ) : orders.length === 0 ? (
                        <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                          You have not placed any orders yet.
                        </div>
                      ) : (
                        orders.map(o => (
                          <div key={o.id} className="order-row">
                            <div><div className="order-id">{o.order_number}</div><div className="order-date">{o.items_count} items</div></div>
                            <div className="order-date">{formatDate(o.created_at)}</div>
                            <div className="order-amount">{o.total_amount}</div>
                            <span className={`order-status status-${o.status.toLowerCase()}`}>{o.status}</span>
                            <Link href="/track" className="btn-track">Track</Link>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Profile */}
              {activeTab === 'profile' && (
                <div className="account-card">
                  <div className="account-card-head"><h2>Edit Profile</h2></div>
                  <div className="account-card-body">
                    <form onSubmit={e => { e.preventDefault(); setSaved(true); setTimeout(()=>setSaved(false),3000); }} className="profile-form">
                      <div className="form-field"><label htmlFor="prof-fname">First Name</label><input type="text" id="prof-fname" defaultValue={user?.first_name || user?.username || ''} /></div>
                      <div className="form-field"><label htmlFor="prof-lname">Last Name</label><input type="text" id="prof-lname" defaultValue={user?.last_name || ''} placeholder="Optional" /></div>
                      <div className="form-field"><label htmlFor="prof-email">Email Address</label><input type="email" id="prof-email" defaultValue={user?.email || ''} readOnly style={{ opacity: 0.7 }} /></div>
                      <div className="form-field"><label htmlFor="prof-phone">Phone Number</label><input type="tel" id="prof-phone" defaultValue={user?.phone || ''} placeholder="Optional" /></div>
                      <div className="form-field full"><label htmlFor="prof-dob">Date of Birth</label><input type="date" id="prof-dob" /></div>
                    </form>
                  </div>
                  <div className="account-card-footer">
                    {saved && <span style={{ color: '#27AE60', fontWeight: 600, marginRight: '16px' }}>✓ Profile Updated!</span>}
                    <button className="btn-save" onClick={() => { setSaved(true); setTimeout(()=>setSaved(false),3000); }}>Save Changes</button>
                  </div>
                </div>
              )}

              {/* Addresses */}
              {activeTab === 'addresses' && (
                <div className="account-card">
                  <div className="account-card-head">
                    <h2>Saved Addresses</h2>
                    {!isEditingAddress && <button onClick={() => setIsEditingAddress(true)} className="btn-track" style={{ background: 'var(--primary)', color: '#fff', border: 'none' }}>+ Add / Edit</button>}
                  </div>
                  
                  {isEditingAddress ? (
                    <div className="account-card-body">
                      <form onSubmit={handleSaveAddress} className="profile-form">
                        <div className="form-field"><label>Address Line 1</label><input type="text" required value={addressForm.line1} onChange={e=>setAddressForm({...addressForm, line1: e.target.value})} placeholder="Flat, House no., Building" /></div>
                        <div className="form-field"><label>Address Line 2</label><input type="text" value={addressForm.line2} onChange={e=>setAddressForm({...addressForm, line2: e.target.value})} placeholder="Area, Street, Sector, Village" /></div>
                        <div className="form-field"><label>City</label><input type="text" required value={addressForm.city} onChange={e=>setAddressForm({...addressForm, city: e.target.value})} /></div>
                        <div className="form-field"><label>State</label><input type="text" required value={addressForm.state} onChange={e=>setAddressForm({...addressForm, state: e.target.value})} /></div>
                        <div className="form-field"><label>Pincode</label><input type="text" required value={addressForm.pin} onChange={e=>setAddressForm({...addressForm, pin: e.target.value})} /></div>
                        <div className="form-field full" style={{ display: 'flex', flexDirection: 'row', gap: '12px', marginTop: '12px' }}>
                          <button type="submit" className="btn-save" style={{ flex: 1 }}>Save Address</button>
                          <button type="button" onClick={() => setIsEditingAddress(false)} className="btn-track" style={{ flex: 1 }}>Cancel</button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div className="account-card-body">
                      {(user?.address_line1 || user?.city) ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                          <div style={{ padding: '20px', border: '1.5px solid var(--primary)', borderRadius: 'var(--radius-md)', background: 'rgba(212,82,42,0.03)', position: 'relative' }}>
                            <span style={{ position: 'absolute', top: '20px', right: '20px', background: 'var(--primary)', color: '#fff', fontSize: '10px', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>DEFAULT</span>
                            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-heading)' }}>Home</h3>
                            <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                              {user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.username || 'User'}<br/>
                              {user.address_line1}<br/>
                              {user.address_line2 && <>{user.address_line2}<br/></>}
                              {user.city}, {user.state} {user.pincode}<br/>
                              Ph: +91 {user?.phone || '9876543210'}
                            </p>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                              <button onClick={() => setIsEditingAddress(true)} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Edit</button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                          <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginBottom: '24px' }}>You haven't saved any addresses yet.</p>
                          <button onClick={() => setIsEditingAddress(true)} className="btn-save">Add New Address</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Wishlist */}
              {activeTab === 'wishlist' && (
                <div className="account-card">
                  <div className="account-card-head"><h2>My Wishlist ({wishlistCount})</h2></div>
                  <div className="account-card-body">
                    {wishlistCount > 0 ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                        {wishlistItems.map((prod) => (
                          <div key={prod.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                            <div style={{ height: '220px', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {prod.images && prod.images.length > 0 ? (
                                <img src={getImageUrl((prod.images.find((i:any) => i.is_primary == 1 || i.is_primary === true)?.image_url) || prod.images[0].image_url, 'thumb')} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
                              ) : (
                                <img src="/images/product_placeholder.jpg" alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
                              )}
                            </div>
                            <div style={{ padding: '16px' }}>
                              <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-heading)' }}>{prod.name}</h4>
                              <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-heading)' }}>₹{prod.sale}</p>
                              <Link href={`/product?id=${prod.id}`} className="btn-save" style={{ display: 'block', padding: '8px', width: '100%', fontSize: '13px', marginTop: '12px', borderRadius: '4px', textDecoration: 'none', textAlign: 'center' }}>View Item</Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '40px' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: '48px', height: '48px', color: 'var(--text-muted)', margin: '0 auto 16px' }}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                        <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginBottom: '24px' }}>Your wishlist is empty.</p>
                        <Link href="/shop" className="btn-save" style={{ textDecoration: 'none', display: 'inline-block' }}>Discover Fashion</Link>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Settings */}
              {activeTab === 'settings' && (
                <div className="account-card">
                  <div className="account-card-head"><h2>Account Settings</h2></div>
                  <div className="account-card-body" style={{ padding: '10px 24px 30px' }}>
                    
                    <h3 className="settings-section-title">Preferences</h3>
                    <div className="settings-row">
                      <div className="settings-label">
                        <span className="settings-title">Order Updates</span>
                        <span className="settings-desc">Receive notifications about delivery tracking</span>
                      </div>
                      <label className="switch">
                        <input type="checkbox" checked={emailUpdates} onChange={e => handleToggleSettings('updates', e.target.checked)} />
                        <span className="slider"></span>
                      </label>
                    </div>
                    <div className="settings-row">
                      <div className="settings-label">
                        <span className="settings-title">Promotions & Offers</span>
                        <span className="settings-desc">Get the latest deals and new arrivals straight to your inbox</span>
                      </div>
                      <label className="switch">
                        <input type="checkbox" checked={emailPromos} onChange={e => handleToggleSettings('promos', e.target.checked)} />
                        <span className="slider"></span>
                      </label>
                    </div>

                    <h3 className="settings-section-title">Security</h3>
                    <div className="settings-row" style={{ alignItems: 'flex-start' }}>
                      <div className="settings-label" style={{ flex: 1 }}>
                        <span className="settings-title">Password</span>
                        <span className="settings-desc" style={{ marginBottom: isChangingPass ? '16px' : '0' }}>Keep your account secure by regularly updating your password</span>
                        
                        {isChangingPass && (
                          <form onSubmit={handlePasswordChange} className="profile-form" style={{ marginTop: '12px' }}>
                            <div className="form-field"><label>Current Password</label><input type="password" required value={passForm.oldPass} onChange={e=>setPassForm({...passForm, oldPass: e.target.value})} /></div>
                            <div className="form-field"><label>New Password</label><input type="password" required minLength={8} value={passForm.newPass} onChange={e=>setPassForm({...passForm, newPass: e.target.value})} placeholder="Min. 8 characters" /></div>
                            <div className="form-field full" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                              <button type="submit" className="btn-save" style={{ padding: '10px 20px', fontSize: '13px' }}>Update Password</button>
                              <button type="button" onClick={() => { setIsChangingPass(false); setPassMsg(''); }} className="btn-track" style={{ border: 'none' }}>Cancel</button>
                              {passMsg && <span style={{ fontSize: '13px', color: passMsg.includes('success') ? '#27AE60' : '#EF4444', fontWeight: 500 }}>{passMsg}</span>}
                            </div>
                          </form>
                        )}
                      </div>
                      {!isChangingPass && (
                        <button onClick={() => setIsChangingPass(true)} className="btn-track" style={{ background: 'var(--bg-subtle)' }}>Change Password</button>
                      )}
                    </div>

                    <h3 className="settings-section-title" style={{ color: '#EF4444' }}>Danger Zone</h3>
                    <div className="settings-row" style={{ borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                      <div className="settings-label">
                        <span className="settings-title" style={{ color: '#EF4444' }}>Delete Account</span>
                        <span className="settings-desc">Permanently remove your account and all data</span>
                      </div>
                      <button onClick={handleDeleteAccount} className="btn-track" style={{ color: '#EF4444', borderColor: '#EF4444', background: 'rgba(239, 68, 68, 0.05)' }}>Delete Account</button>
                    </div>

                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      </section>
    </main>
  );
}
