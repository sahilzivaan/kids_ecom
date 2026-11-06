'use client';

import { useState, useEffect } from 'react';
import AdminTable, { Column } from '@/components/admin/AdminTable';
import Modal from '@/components/admin/Modal';
import { useToast } from '@/components/admin/Toast';
import { fetchWithAuth } from '@/utils/api';
import { Customer } from '@/types';
import ExportDropdown from '@/components/admin/ExportDropdown';

export default function CustomersPage() {
  const [data, setData] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { showToast } = useToast();

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await fetchWithAuth('/customers');
        if (res.ok) {
          const json = await res.json();
          setData(json.customers || []);
        }
      } catch (err) {
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  const columns: Column[] = [
    { key: 'checkbox', label: '', sortable: false, className: 'no-sort' },
    { key: 'name', label: 'Customer', sortable: true },
    { key: 'contact', label: 'Contact', sortable: false },
    { key: 'city', label: 'City', sortable: true },
    { key: 'orders', label: 'Orders', sortable: true },
    { key: 'spent', label: 'Total Spent', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'actions', label: 'Actions', sortable: false, className: 'no-sort' }
  ];

  const filteredData = data.filter(r => !statusFilter || r.status === statusFilter);

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      const res = await fetchWithAuth(`/customers/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setData(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
        showToast(`👤 Customer status updated to ${newStatus}`, newStatus === 'Active' ? 'success' : 'warning');
      } else {
        showToast(`❌ Failed to update status for customer.`, 'error');
      }
    } catch (err) {
      showToast(`❌ Error updating customer status.`, 'error');
    }
  };

  const handleBulkAction = async (newStatus: string) => {
    if (selectedIds.size === 0) return;
    
    try {
      const promises = Array.from(selectedIds).map(id => 
        fetchWithAuth(`/customers/${id}/status`, {
          method: 'PUT',
          body: JSON.stringify({ status: newStatus })
        })
      );
      
      await Promise.all(promises);
      
      setData(prev => prev.map(c => selectedIds.has(c.id) ? { ...c, status: newStatus } : c));
      showToast(`✅ Marked ${selectedIds.size} customers as ${newStatus}.`, 'success');
      setSelectedIds(new Set());
    } catch (err) {
      showToast('❌ Error performing bulk action.', 'error');
    }
  };

  const renderRow = (row: any, i: number) => {
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
        <td>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="cp-avatar" style={{ width: '36px', height: '36px', fontSize: '13px', borderWidth: '1px' }}>{row.initials || 'C'}</div>
            <div>
              <div style={{ fontWeight: 500, color: 'var(--platinum)' }}>{row.name}</div>
              <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Joined {row.joined}</div>
            </div>
          </div>
        </td>
        <td>
          <div style={{ fontSize: '13px' }}>{row.email}</div>
          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>+91 {row.phone}</div>
        </td>
        <td>{row.city}</td>
        <td><span className="badge b-muted">{row.orders}</span></td>
        <td><strong style={{ color: 'var(--gold)' }}>₹{(row.spent || 0).toLocaleString('en-IN')}</strong></td>
        <td>
          <select
            className={`badge ${statusCls}`}
            style={{ 
              cursor: 'pointer', 
              border: 'none',
              outline: 'none',
              textAlign: 'center',
              appearance: 'none',
              padding: '4px 10px'
            }}
            value={row.status}
            onChange={(e) => handleStatusChange(row.id, e.target.value)}
            title="Click to change status"
          >
            <option value="Active" style={{ background: 'var(--navy)', color: '#10b981' }}>Active</option>
            <option value="Inactive" style={{ background: 'var(--navy)', color: 'var(--muted)' }}>Inactive</option>
          </select>
        </td>
        <td>
          <div className="row-actions">
            <button className="act-btn act-view" title="View Profile" onClick={() => { setSelectedCustomer(row); setViewModalOpen(true); }}>👁</button>
          </div>
        </td>
      </tr>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
        <div className="spinner"></div>
        <div style={{ marginTop: '16px' }}>Loading customers...</div>
      </div>
    );
  }

  return (
    <>
      <div className="admin-card">
        <div className="card-header">
          <div className="card-header-left">
            <div className="card-title-icon">👥</div>
            <span className="card-title">Customers Directory</span>
            <span className="card-count" id="cust-count">{filteredData.length}</span>
          </div>
          <div className="card-header-right tbl-controls">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input type="text" placeholder="Search customers…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="filter-sel" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <ExportDropdown 
              data={filteredData}
              filenamePrefix="customers"
              title="Customers Summary Report"
              buttonLabel="Export"
              columns={[
                { key: 'name', label: 'Name' },
                { key: 'email', label: 'Email' },
                { key: 'phone', label: 'Phone' },
                { key: 'city', label: 'City' },
                { key: 'orders', label: 'Total Orders' },
                { key: 'spent', label: 'Total Spent' },
                { key: 'status', label: 'Status' }
              ]}
            />
          </div>
        </div>

        {selectedIds.size > 0 && (
          <div style={{ padding: '10px 20px', background: 'rgba(212,175,55,0.1)', borderBottom: '1px solid var(--glass-b)', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gold)', marginRight: '10px' }}>{selectedIds.size} selected</span>
            <button className="btn btn-outline btn-sm" onClick={() => handleBulkAction('Active')}>Mark Active</button>
            <button className="btn btn-outline btn-sm" onClick={() => handleBulkAction('Inactive')}>Mark Inactive</button>
          </div>
        )}

        <div className="card-body">
          {data.length > 0 ? (
            <AdminTable 
              id="cust"
              columns={columns}
              data={filteredData}
              searchFields={['name', 'email', 'phone', 'city']}
              searchQuery={search}
              perPage={10}
              renderRow={renderRow}
              selectAllId="sa-cust"
              onSelectAll={(checked) => {
                if (checked) setSelectedIds(new Set(filteredData.map(d => d.id)));
                else setSelectedIds(new Set());
              }}
            />
          ) : (
            <div className="empty-state" style={{ padding: '60px 20px' }}>
              <div className="empty-icon" style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
              <h3>No Customers Yet</h3>
              <p style={{ color: 'var(--muted)', marginBottom: '24px' }}>There are currently no customers in the database.</p>
            </div>
          )}
        </div>
      </div>

      {/* Customer Profile Modal */}
      {selectedCustomer && (
        <Modal 
          isOpen={viewModalOpen} 
          onClose={() => setViewModalOpen(false)} 
          title="Customer Profile"
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setViewModalOpen(false)}>Close</button>
              <button className="btn btn-gold" onClick={() => { showToast('✉️ Password reset link sent to customer email', 'success'); setViewModalOpen(false); }}>✉️ Send Password Reset</button>
            </>
          }
        >
          <div className="cp-header">
            <div className="cp-avatar">{selectedCustomer.initials || 'C'}</div>
            <div>
              <h3 style={{ fontSize: '18px', color: 'var(--platinum)', marginBottom: '4px' }}>{selectedCustomer.name}</h3>
              <p style={{ fontSize: '13px', color: 'var(--muted)' }}>Customer since {selectedCustomer.joined}</p>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <span className={`badge ${selectedCustomer.status === 'Active' ? 'b-success' : 'b-muted'}`}>{selectedCustomer.status}</span>
            </div>
          </div>
          
          <div className="cs-grid">
            <div className="cs-box">
              <div className="cs-val">{selectedCustomer.orders}</div>
              <div className="cs-lbl">Total Orders</div>
            </div>
            <div className="cs-box">
              <div className="cs-val" style={{ color: 'var(--emerald)' }}>₹{(selectedCustomer.spent || 0).toLocaleString('en-IN')}</div>
              <div className="cs-lbl">Lifetime Value</div>
            </div>
            <div className="cs-box">
              <div className="cs-val" style={{ fontSize: '16px', paddingTop: '4px', color: 'var(--platinum)' }}>{Math.round((selectedCustomer.spent || 0) / (selectedCustomer.orders || 1))}</div>
              <div className="cs-lbl">Avg. Order Value</div>
            </div>
          </div>

          <div className="od-grid">
            <div className="od-block"><div className="od-label">Email Address</div><div className="od-val">{selectedCustomer.email}</div></div>
            <div className="od-block"><div className="od-label">Phone Number</div><div className="od-val">+91 {selectedCustomer.phone}</div></div>
            <div className="od-block"><div className="od-label">City</div><div className="od-val">{selectedCustomer.city}</div></div>
            <div className="od-block"><div className="od-label">Customer ID</div><div className="od-val">CUST-{selectedCustomer.id.toString().padStart(4, '0')}</div></div>
          </div>
        </Modal>
      )}
    </>
  );
}
