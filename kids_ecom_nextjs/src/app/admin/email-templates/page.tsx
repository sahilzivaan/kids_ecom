'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/admin/Toast';
import { fetchWithAuth } from '@/utils/api';
import Modal from '@/components/admin/Modal';
import QuillEditor from '@/components/admin/QuillEditor';

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetchWithAuth('/email/templates');
      if (res.ok) {
        const json = await res.json();
        setTemplates(json.templates || []);
      }
    } catch (err) {
      showToast('❌ Failed to load email templates.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (template: any) => {
    setEditingTemplate({ ...template });
  };

  const handleModalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditingTemplate((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSaveTemplate = async () => {
    if (!editingTemplate) return;
    try {
      const res = await fetchWithAuth(`/email/templates/${editingTemplate.id}`, {
        method: 'PUT',
        body: JSON.stringify(editingTemplate)
      });
      if (res.ok) {
        showToast('📝 Template updated successfully!', 'success');
        setEditingTemplate(null);
        fetchTemplates();
      } else {
        showToast('❌ Failed to update template.', 'error');
      }
    } catch (err) {
      showToast('❌ Error updating template.', 'error');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
        <div className="spinner"></div>
        <div style={{ marginTop: '16px' }}>Loading templates...</div>
      </div>
    );
  }

  return (
    <>
      <div className="admin-card">
        <div className="card-header">
          <div className="card-header-left">
            <div className="card-title-icon">📄</div>
            <span className="card-title">Email Templates</span>
          </div>
        </div>
        <div className="card-body">
        <table className="admin-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ padding: '12px', borderBottom: '1px solid var(--glass-b)' }}>Event / Trigger</th>
              <th style={{ padding: '12px', borderBottom: '1px solid var(--glass-b)' }}>Subject Line</th>
              <th style={{ padding: '12px', borderBottom: '1px solid var(--glass-b)' }}>Status</th>
              <th style={{ padding: '12px', borderBottom: '1px solid var(--glass-b)', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {templates.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)' }}>
                  No templates found.
                </td>
              </tr>
            ) : (
              templates.map((tpl) => (
                <tr key={tpl.id}>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--glass-b)' }}>
                    <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{tpl.trigger_name?.replace(/_/g, ' ')}</div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'monospace' }}>{tpl.trigger_name}</div>
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--glass-b)' }}>{tpl.subject}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--glass-b)' }}>
                    {tpl.is_active ? (
                      <span style={{ color: 'var(--emerald)', fontWeight: 'bold' }}>Active</span>
                    ) : (
                      <span style={{ color: 'var(--rose)' }}>Inactive</span>
                    )}
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--glass-b)', textAlign: 'right' }}>
                    <button className="btn btn-gold" onClick={() => handleEditClick(tpl)} style={{ padding: '6px 12px', fontSize: '13px' }}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      <Modal 
        isOpen={!!editingTemplate} 
        onClose={() => setEditingTemplate(null)} 
        title="Edit Email Template"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setEditingTemplate(null)}>Cancel</button>
            <button className="btn btn-gold" onClick={handleSaveTemplate}>Save Template</button>
          </>
        }
      >
        {editingTemplate && (
          <div className="form-grid">
            <div className="form-group full">
              <label className="form-label">Subject</label>
              <input type="text" className="form-control" name="subject" value={editingTemplate.subject || ''} onChange={handleModalChange} />
            </div>
            
            <div className="form-group full">
              <label className="form-label">HTML Body</label>
              <QuillEditor 
                value={editingTemplate.html_content || ''} 
                onChange={(content) => setEditingTemplate((prev: any) => ({ ...prev, html_content: content }))}
                height="250px"
              />
              <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                You can use placeholders like {'{{customer_name}}'}, {'{{order_id}}'}, etc.
              </p>
            </div>
            
            <div className="form-group full">
              <div className="toggle-row" style={{ borderBottom: 'none', padding: '10px 0 0 0' }}>
                <div className="toggle-info">
                  <h4 style={{ fontSize: '14px', color: 'var(--platinum)', marginBottom: '2px' }}>Template is Active</h4>
                  <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0 }}>Enable or disable this email template.</p>
                </div>
                <label className="toggle-sw">
                  <input 
                    type="checkbox" 
                    checked={Boolean(editingTemplate.is_active)} 
                    onChange={(e) => setEditingTemplate((prev: any) => ({ ...prev, is_active: e.target.checked ? 1 : 0 }))} 
                  />
                  <div className="toggle-slider"></div>
                </label>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
