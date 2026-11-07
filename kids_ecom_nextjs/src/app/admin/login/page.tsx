'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/utils/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE_URL}/auth/admin-login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'bypass-tunnel-reminder': 'true'
        },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (!res.ok) {
        const errMsg = data.messages?.error || (typeof data.error === 'string' ? data.error : null) || 'Invalid email or password.';
        setError(errMsg);
        setIsLoading(false);
        return;
      }

      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminUser', JSON.stringify(data.user));
      window.location.href = '/admin';
    } catch (err) {
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Background animated orbs */}
      <div className="l-orb orb1"></div>
      <div className="l-orb orb2"></div>
      <div className="l-orb orb3"></div>

      <div className="login-card">
        <div className="login-logo">
          <div className="logo-circle">👗</div>
          <h1>Chhotu Fashion</h1>
          <p>Admin Portal Access</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form className="login-form" onSubmit={handleLogin}>
          <div className="form-group">
            <span className="field-icon">✉️</span>
            <input 
              type="email" 
              className="form-control" 
              placeholder="Admin Email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <span className="field-icon">🔑</span>
            <input 
              type="password" 
              className="form-control" 
              placeholder="Password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-login btn-gold" disabled={isLoading}>
            {isLoading ? 'Authenticating...' : 'Secure Login'}
          </button>
        </form>

        <div className="login-hint">
          <p>Demo Credentials:</p>
          <p>Email: <strong>admin@chhotufashion.com</strong> | Pass: <strong>admin123</strong></p>
        </div>
      </div>
    </div>
  );
}
