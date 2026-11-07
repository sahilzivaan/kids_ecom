'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { API_BASE_URL } from '@/utils/api';

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/account';
  const [activeTab, setActiveTab] = useState<'signin'|'register'>('signin');
  const [siEmail, setSiEmail] = useState('');
  const [siPass, setSiPass] = useState('');
  const [regFname, setRegFname] = useState('');
  const [regLname, setRegLname] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPass, setRegPass] = useState('');
  const [msg, setMsg] = useState('');
  const [isRedirecting, setIsRedirecting] = useState(false);

  const extractError = (data: any, defaultMsg: string) => {
    if (!data) return defaultMsg;
    if (data.messages) {
      if (typeof data.messages === 'string') return data.messages;
      if (typeof data.messages === 'object') {
        if (data.messages.error) return data.messages.error;
        const vals = Object.values(data.messages).filter(Boolean);
        if (vals.length > 0) return vals.join(' ');
      }
    }
    if (typeof data.error === 'string') return data.error;
    if (data.message && typeof data.message === 'string') return data.message;
    return defaultMsg;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: siEmail, password: siPass })
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(extractError(data, 'Login failed. Please check your credentials.'));
        return;
      }
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.dispatchEvent(new Event('cart_updated'));
      window.dispatchEvent(new Event('wishlist_updated'));
      setIsRedirecting(true);
      setTimeout(() => { window.location.href = redirectUrl; }, 1200);
    } catch (err) {
      setMsg('An error occurred during login. Please try again later.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          first_name: regFname, 
          last_name: regLname, 
          email: regEmail, 
          phone: regPhone, 
          password: regPass 
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(extractError(data, 'Registration failed. Please check all required fields.'));
        return;
      }
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.dispatchEvent(new Event('cart_updated'));
      window.dispatchEvent(new Event('wishlist_updated'));
      setIsRedirecting(true);
      setTimeout(() => { window.location.href = redirectUrl; }, 1200);
    } catch (err) {
      setMsg('An error occurred during registration. Please try again later.');
    }
  };

  return (
    <section className="auth-section">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z"/>
            </svg>
          </div>
          <h1>Chhotu Fashion</h1>
          <p>India&apos;s #1 Kids Clothing Brand</p>
        </div>

        <div className="auth-tabs" role="tablist">
          <button className={`auth-tab${activeTab==='signin'?' active':''}`} id="tab-signin" role="tab" aria-selected={activeTab==='signin'} onClick={() => setActiveTab('signin')}>Sign In</button>
          <button className={`auth-tab${activeTab==='register'?' active':''}`} id="tab-register" role="tab" aria-selected={activeTab==='register'} onClick={() => setActiveTab('register')}>Create Account</button>
        </div>

        <div className="auth-body">
          {msg && <div className="auth-message error" role="alert">{msg}</div>}

          {activeTab === 'signin' && (
            <form className="auth-form" id="form-signin" onSubmit={handleSignIn}>
              <div>
                <label htmlFor="si-email">Email Address</label>
                <input type="email" id="si-email" placeholder="priya@example.com" required value={siEmail} onChange={e=>setSiEmail(e.target.value)} />
              </div>
              <div>
                <label htmlFor="si-pass">Password</label>
                <input type="password" id="si-pass" placeholder="••••••••" required value={siPass} onChange={e=>setSiPass(e.target.value)} />
                <p className="forgot-link" style={{ marginTop: '8px' }}><a href="#">Forgot password?</a></p>
              </div>
              <button type="submit" className="btn-auth">Sign In to My Account</button>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '16px' }}>Don&apos;t have an account? <button type="button" onClick={() => setActiveTab('register')} style={{ color: 'var(--primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px' }}>Create one free</button></p>
            </form>
          )}

          {activeTab === 'register' && (
            <form className="auth-form" id="form-register" onSubmit={handleRegister}>
              <div className="form-row2">
                <div><label htmlFor="reg-fname">First Name</label><input type="text" id="reg-fname" placeholder="Priya" required value={regFname} onChange={e=>setRegFname(e.target.value)} /></div>
                <div><label htmlFor="reg-lname">Last Name</label><input type="text" id="reg-lname" placeholder="Sharma" required value={regLname} onChange={e=>setRegLname(e.target.value)} /></div>
              </div>
              <div><label htmlFor="reg-email">Email Address</label><input type="email" id="reg-email" placeholder="priya@example.com" required value={regEmail} onChange={e=>setRegEmail(e.target.value)} /></div>
              <div><label htmlFor="reg-phone">Mobile Number</label><input type="tel" id="reg-phone" placeholder="+91 98765 43210" required value={regPhone} onChange={e=>setRegPhone(e.target.value)} /></div>
              <div><label htmlFor="reg-pass">Create Password</label><input type="password" id="reg-pass" placeholder="Min. 8 characters" required value={regPass} onChange={e=>setRegPass(e.target.value)} /></div>
              <button type="submit" className="btn-auth">Create My Account</button>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>Already have an account? <button type="button" onClick={() => setActiveTab('signin')} style={{ color: 'var(--primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px' }}>Sign in</button></p>
            </form>
          )}
        </div>
      </div>

      {isRedirecting && (
        <div className="redirect-modal-overlay">
          <div className="redirect-modal">
            <div className="spinner"></div>
            <h2>Redirecting</h2>
            <p>Taking you to your account securely...</p>
          </div>
        </div>
      )}
    </section>
  );
}

export default function SignInPage() {
  return (
    <main id="main-content">
      <style>{`
        .auth-section { min-height: calc(100vh - 80px); display: flex; align-items: center; justify-content: center; padding: 60px 20px; background: var(--bg); }
        .auth-card { width: 100%; max-width: 460px; background: #fff; border-radius: var(--radius-lg); border: 1px solid var(--border); overflow: hidden; box-shadow: var(--shadow-xl); }
        .auth-brand { background: var(--accent); padding: 36px 40px; text-align: center; }
        .auth-brand-logo { width: 52px; height: 52px; border-radius: 14px; background: var(--primary); display: flex; align-items: center; justify-content: center; margin: 0 auto 14px; }
        .auth-brand-logo svg { width: 26px; height: 26px; }
        .auth-brand h1 { font-family: var(--font-serif); font-size: 22px; color: #fff; margin-bottom: 4px; }
        .auth-brand p { font-size: 13px; color: rgba(255,255,255,0.5); }
        .auth-tabs { display: flex; border-bottom: 1px solid var(--border); }
        .auth-tab { flex: 1; padding: 16px; text-align: center; font-size: 14px; font-weight: 600; color: var(--text-muted); background: none; border: none; cursor: pointer; transition: var(--transition); border-bottom: 2px solid transparent; margin-bottom: -1px; }
        .auth-tab.active { color: var(--primary); border-bottom-color: var(--primary); }
        .auth-body { padding: 32px 40px 40px; }
        .auth-form { display: flex; flex-direction: column; gap: 16px; }
        .auth-form label { font-size: 12px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; display: block; }
        .auth-form input { width: 100%; padding: 12px 16px; border: 1.5px solid var(--border); border-radius: var(--radius-sm); font-size: 14px; color: var(--text-heading); background: var(--bg); outline: none; transition: var(--transition); }
        .auth-form input:focus { border-color: var(--primary); background: #fff; box-shadow: 0 0 0 3px rgba(212,82,42,0.08); }
        .form-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .forgot-link { font-size: 12px; color: var(--text-muted); text-align: right; }
        .forgot-link a { color: var(--primary); font-weight: 600; }
        .btn-auth { width: 100%; padding: 14px; border-radius: var(--radius-full); background: var(--primary); color: #fff; font-size: 15px; font-weight: 700; border: none; cursor: pointer; transition: var(--transition); margin-top: 4px; }
        .btn-auth:hover { background: var(--primary-dark); transform: translateY(-1px); box-shadow: var(--shadow-md); }
        .auth-divider { text-align: center; position: relative; color: var(--text-muted); font-size: 12px; }
        .auth-divider::before, .auth-divider::after { content: ''; position: absolute; top: 50%; height: 1px; width: 42%; background: var(--border); }
        .auth-divider::before { left: 0; }
        .auth-divider::after  { right: 0; }
        .btn-social { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 12px; border-radius: var(--radius-sm); border: 1.5px solid var(--border); background: #fff; font-size: 14px; font-weight: 500; color: var(--text-heading); cursor: pointer; transition: var(--transition); }
        .btn-social:hover { border-color: var(--accent); background: var(--bg); }
        .btn-social svg { width: 18px; height: 18px; flex-shrink: 0; }
        .auth-message { text-align: center; padding: 14px; border-radius: var(--radius-sm); font-size: 13.5px; font-weight: 600; margin-bottom: 20px; }
        .auth-message.error { background: rgba(239,68,68,0.1); color: #EF4444; border: 1px solid rgba(239,68,68,0.2); }
        .auth-message.success { background: rgba(39,174,96,0.1); color: #27AE60; border: 1px solid rgba(39,174,96,0.2); }
        .redirect-modal-overlay { position: fixed; inset: 0; background: rgba(10, 15, 30, 0.7); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 9999; }
        .redirect-modal { background: #fff; padding: 40px; border-radius: var(--radius-lg); text-align: center; box-shadow: var(--shadow-xl); width: 100%; max-width: 320px; animation: modalPop 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; transform: scale(0.9); opacity: 0; }
        .redirect-modal h2 { font-family: var(--font-serif); font-size: 22px; color: var(--text-heading); margin-top: 20px; margin-bottom: 8px; }
        .redirect-modal p { font-size: 14px; color: var(--text-muted); }
        .spinner { width: 44px; height: 44px; border: 3px solid rgba(212,82,42,0.15); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes modalPop { to { transform: scale(1); opacity: 1; } }
        @media (max-width: 480px) { .auth-body { padding: 24px 20px 32px; } .form-row2 { grid-template-columns: 1fr; } }
      `}</style>
      <Suspense fallback={<div style={{ padding: '60px', textAlign: 'center' }}>Loading...</div>}>
        <SignInContent />
      </Suspense>
    </main>
  );
}
