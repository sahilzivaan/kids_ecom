'use client';

import { useState, useEffect } from 'react';
import AdminTable from '@/components/admin/AdminTable';
import Modal from '@/components/admin/Modal';
import { useToast } from '@/components/admin/Toast';
import { fetchWithAuth } from '@/utils/api';
import { Coupon } from '@/types';
import { formatDate } from '@/utils/date';
import ExportDropdown from '@/components/admin/ExportDropdown';

export default function CouponsPage() {
  const [data, setData] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const { showToast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Form State
  const [formData, setFormData] = useState<Omit<Coupon, 'id' | 'usage_count'>>({
    code: '',
    type: 'percent',
    value: 0,
    min_order: 0,
    expiry: '',
    status: 'Active'
  });

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const res = await fetchWithAuth('/coupons');
        if (res.ok) {
          const json = await res.json();
          setData(json.coupons || []);
        } else {
          // Graceful degradation if backend doesn't support coupons yet
          setData([]);
        }
      } catch (err) {
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCoupons();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isEdit = (formData as any).id;
      const url = isEdit ? `/coupons/${(formData as any).id}` : '/coupons';
      const method = isEdit ? 'PUT' : 'POST';
      
      const res = await fetchWithAuth(url, {
        method,
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        const result = await res.json();
        if (isEdit) {
          setData(prev => prev.map(c => c.id === result.coupon.id ? result.coupon : c));
          showToast('✅ Coupon updated.', 'success');
        } else {
          setData(prev => [result.coupon, ...prev]);
          showToast('✅ Coupon created.', 'success');
        }
        setModalOpen(false);
      } else {
        showToast('❌ Failed to save coupon.', 'error');
      }
    } catch (err) {
      // Mock update if backend fails
      const mockId = (formData as any).id || Date.now();
      const mockCoupon = { ...formData, id: mockId, usage_count: 0 } as Coupon;
      if ((formData as any).id) {
         setData(prev => prev.map(c => c.id === mockId ? mockCoupon : c));
      } else {
         setData(prev => [mockCoupon, ...prev]);
      }
      showToast('⚠️ Backend unavailable. Mock saved.', 'warning');
      setModalOpen(false);
    }
  };

  const handleEdit = (row: any) => {
    setFormData({ ...row });
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (deleteTarget) {
      try {
        await fetchWithAuth(`/coupons/${deleteTarget.id}`, { method: 'DELETE' });
        setData(prev => prev.filter(c => c.id !== deleteTarget.id));
        showToast('🗑 Coupon deleted.', 'warning');
        setDeleteModalOpen(false);
      } catch (err) {
        // Mock delete
        setData(prev => prev.filter(c => c.id !== deleteTarget.id));
        showToast('🗑 Coupon deleted (Mock).', 'warning');
        setDeleteModalOpen(false);
      }
    }
  };

  const handleBulkAction = async (action: 'delete' | 'Active' | 'Inactive') => {
    if (selectedIds.size === 0) return;
    
    try {
      if (action === 'delete') {
         setData(prev => prev.filter(p => !selectedIds.has(p.id)));
         showToast(`🗑 Deleted ${selectedIds.size} coupons.`, 'warning');
      } else {
         setData(prev => prev.map(p => selectedIds.has(p.id) ? { ...p, status: action } : p));
         showToast(`✅ Marked ${selectedIds.size} coupons as ${action}.`, 'success');
      }
      setSelectedIds(new Set());
    } catch (err) {
      showToast('❌ Error performing bulk action.', 'error');
    }
  };

  const filteredData = data.filter(r => 
    r.code.toLowerCase().includes(search.toLowerCase())
  );

  const renderRow = (row: Coupon, i: number) => {
    const statusCls = row.status === 'Active' ? 'b-success' : 'b-muted';
    return (
      <tr key={row.id}>
        <td>
          <input 
            type="checkbox" 
            className="row-cb" 
            checked={selectedIds.has(row.id)} 
            onChange={(e) => {
              const newSet = new Set(selectedIds);
              if (e.target.checked) newSet.add(row.id);
              else newSet.delete(row.id);
              setSelectedIds(newSet);
            }} 
          />
        </td>
        <td><strong style={{ color: 'var(--gold)' }}>{row.code}</strong></td>
        <td>{row.type === 'percent' ? `${row.value}% OFF` : `₹${row.value} OFF`}</td>
        <td>₹{row.min_order}</td>
        <td>{row.expiry ? formatDate(row.expiry) : 'Never'}</td>
        <td>{row.usage_count}</td>
        <td><span className={`badge ${statusCls}`}>{row.status}</span></td>
        <td>
          <div className="row-actions">
            <button className="act-btn act-edit" title="Edit" onClick={() => handleEdit(row)}>✏️</button>
            <button className="act-btn act-delete" title="Delete" onClick={() => { setDeleteTarget(row); setDeleteModalOpen(true); }}>🗑</button>
          </div>
        </td>
      </tr>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
        <div className="spinner"></div>
        <div style={{ marginTop: '16px' }}>Loading coupons...</div>
      </div>
    );
  }

  return (
    <>
      <div className="admin-card">
        <div className="card-header">
          <div className="card-header-left">
            <div className="card-title-icon">🏷️</div>
            <span className="card-title">Coupons</span>
            <span className="card-count">{filteredData.length}</span>
          </div>
          <div className="card-header-right tbl-controls">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input type="text" placeholder="Search coupons…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <ExportDropdown 
              data={filteredData}
              filenamePrefix="coupons"
              title="Discounts & Coupons Report"
              buttonLabel="Export"
              className="btn btn-outline"
              columns={[
                { key: 'code', label: 'Coupon Code' },
                { key: (row: any) => row.type === 'percent' ? `${row.value}% OFF` : `₹${row.value} OFF`, label: 'Discount' },
                { key: (row: any) => `₹${Number(row.min_order || 0).toLocaleString('en-IN')}`, label: 'Min Order' },
                { key: (row: any) => row.expiry ? formatDate(row.expiry) : 'Never', label: 'Expiry Date' },
                { key: 'usage_count', label: 'Total Uses' },
                { key: 'status', label: 'Status' }
              ]}
            />
            <button className="btn btn-gold" onClick={() => {
              setFormData({ code: '', type: 'percent', value: 0, min_order: 0, expiry: '', status: 'Active' });
              setModalOpen(true);
            }}>
              ＋ Create Coupon
            </button>
          </div>
        </div>

        {selectedIds.size > 0 && (
          <div style={{ padding: '10px 20px', background: 'rgba(212,175,55,0.1)', borderBottom: '1px solid var(--glass-b)', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gold)', marginRight: '10px' }}>{selectedIds.size} selected</span>
            <button className="btn btn-outline btn-sm" onClick={() => handleBulkAction('Active')}>Mark Active</button>
            <button className="btn btn-outline btn-sm" onClick={() => handleBulkAction('Inactive')}>Mark Inactive</button>
            <button className="btn btn-danger btn-sm" onClick={() => {
               if (confirm('Are you sure you want to delete selected coupons?')) handleBulkAction('delete');
            }}>Delete Selected</button>
          </div>
        )}

        <div className="card-body">
          {data.length > 0 ? (
            <AdminTable 
              id="coupons-table"
              columns={[
                { key: 'cb', label: '' },
                { key: 'code', label: 'Code' },
                { key: 'value', label: 'Value' },
                { key: 'min_order', label: 'Min Order' },
                { key: 'expiry', label: 'Expiry Date' },
                { key: 'usage_count', label: 'Uses' },
                { key: 'status', label: 'Status' },
                { key: 'actions', label: 'Actions' }
              ]}
              data={filteredData}
              searchQuery={search}
              perPage={10}
              renderRow={renderRow}
              selectAllId="sa-coupon"
              onSelectAll={(checked) => {
                if (checked) setSelectedIds(new Set(filteredData.map(d => d.id)));
                else setSelectedIds(new Set());
              }}
            />
          ) : (
            <div className="empty-state" style={{ padding: '60px 20px' }}>
              <div className="empty-icon">🏷️</div>
              <h3>No coupons found</h3>
              <p>Create your first discount coupon to boost sales.</p>
              <button className="btn btn-gold" style={{ marginTop: '16px' }} onClick={() => setModalOpen(true)}>Create Coupon</button>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={(formData as any).id ? "Edit Coupon" : "Create Coupon"}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Coupon Code <span className="req">*</span></label>
            <input type="text" className="form-control" name="code" value={formData.code} onChange={handleChange} required style={{ textTransform: 'uppercase' }} />
          </div>
          <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label className="form-label">Discount Type</label>
              <select className="form-control" name="type" value={formData.type} onChange={handleChange}>
                <option value="percent">Percentage (%)</option>
                <option value="flat">Flat Amount (₹)</option>
              </select>
            </div>
            <div>
              <label className="form-label">Discount Value <span className="req">*</span></label>
              <input type="number" className="form-control" name="value" value={formData.value || ''} onChange={handleChange} required />
            </div>
          </div>
          <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label className="form-label">Minimum Order Value (₹)</label>
              <input type="number" className="form-control" name="min_order" value={formData.min_order || ''} onChange={handleChange} />
            </div>
            <div>
              <label className="form-label">Expiry Date</label>
              <input type="date" className="form-control" name="expiry" value={formData.expiry ? formData.expiry.split('T')[0] : ''} onChange={handleChange} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-control" name="status" value={formData.status} onChange={handleChange}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-gold">Save Coupon</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Confirm Delete">
        <p>Are you sure you want to delete coupon <strong>{deleteTarget?.code}</strong>?</p>
        <p style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '8px' }}>This action cannot be undone.</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
          <button className="btn btn-outline" onClick={() => setDeleteModalOpen(false)}>Cancel</button>
          <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
        </div>
      </Modal>
    </>
  );
}
