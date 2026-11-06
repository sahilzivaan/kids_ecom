'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/admin/Toast';
import { fetchWithAuth } from '@/utils/api';

export default function EmailSettingsPage() {
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const [settings, setSettings] = useState({
    smtp_host: '',
    smtp_port: 587,
    smtp_user: '',
    smtp_pass: '',
    smtp_encryption: 'tls',
    from_email: '',
    from_name: ''
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetchWithAuth('/email/settings');
        if (res.ok) {
          const json = await res.json();
          setSettings(json || {});
        }
      } catch (err) {
        showToast('❌ Failed to load email settings.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [showToast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchWithAuth('/email/settings', {
        method: 'PUT',
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        showToast('💾 Email Settings saved successfully!', 'success');
      } else {
        showToast('❌ Failed to save email settings.', 'error');
      }
    } catch (err) {
      showToast('❌ Error saving email settings.', 'error');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
        <div className="spinner"></div>
        <div style={{ marginTop: '16px' }}>Loading email settings...</div>
      </div>
    );
  }

  return (
    <>
      <div className="admin-card">
        <div className="card-header">
          <div className="card-header-left">
            <div className="card-title-icon">⚙️</div>
            <span className="card-title">Email Configuration</span>
          </div>
        </div>
        <div className="card-body" style={{ padding: '24px', paddingTop: '32px' }}>
        <form onSubmit={handleSave}>
          <div className="sec-hdr">
            <div>
              <h3 className="sec-title" style={{ fontSize: '18px' }}>SMTP Settings</h3>
              <p className="sec-sub">Configure your mail server for sending system emails.</p>
            </div>
          </div>
          
          <div className="form-grid" style={{ maxWidth: '800px', marginTop: '16px' }}>
            <div className="form-group full">
              <label className="form-label">SMTP Host</label>
              <input type="text" className="form-control" name="smtp_host" value={settings.smtp_host || ''} onChange={handleChange} placeholder="e.g. smtp.gmail.com" />
            </div>
            
            <div className="form-group">
              <label className="form-label">SMTP Port</label>
              <input type="number" className="form-control" name="smtp_port" value={settings.smtp_port || ''} onChange={handleChange} placeholder="587" />
            </div>
            
            <div className="form-group">
              <label className="form-label">Encryption</label>
              <select className="form-control" name="smtp_encryption" value={settings.smtp_encryption || 'tls'} onChange={handleChange}>
                <option value="tls">TLS</option>
                <option value="ssl">SSL</option>
                <option value="">None</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">SMTP Username</label>
              <input type="text" className="form-control" name="smtp_user" value={settings.smtp_user || ''} onChange={handleChange} placeholder="Username or Email" />
            </div>
            
            <div className="form-group">
              <label className="form-label">SMTP Password</label>
              <input type="password" className="form-control" name="smtp_pass" value={settings.smtp_pass || ''} onChange={handleChange} placeholder="********" />
            </div>
          </div>

          <div className="sec-hdr" style={{ marginTop: '32px' }}>
            <div>
              <h3 className="sec-title" style={{ fontSize: '18px' }}>Sender Identity</h3>
              <p className="sec-sub">How emails will appear to your customers.</p>
            </div>
          </div>
          
          <div className="form-grid" style={{ maxWidth: '800px', marginTop: '16px' }}>
            <div className="form-group">
              <label className="form-label">From Name</label>
              <input type="text" className="form-control" name="from_name" value={settings.from_name || ''} onChange={handleChange} placeholder="e.g. Chhotu Fashion" />
            </div>
            
            <div className="form-group">
              <label className="form-label">From Email</label>
              <input type="email" className="form-control" name="from_email" value={settings.from_email || ''} onChange={handleChange} placeholder="noreply@chhotufashion.com" />
            </div>
            
            <div className="form-group full" style={{ marginTop: '10px' }}>
              <button type="submit" className="btn btn-gold">Save Settings</button>
            </div>
          </div>
        </form>
        </div>
      </div>
    </>
  );
}
