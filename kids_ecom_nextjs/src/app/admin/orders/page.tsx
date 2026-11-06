'use client';

import { useState, useEffect } from 'react';
import AdminTable, { Column } from '@/components/admin/AdminTable';
import Modal from '@/components/admin/Modal';
import { useToast } from '@/components/admin/Toast';
import { fetchWithAuth } from '@/utils/api';
import { Order } from '@/types';
import ExportDropdown from '@/components/admin/ExportDropdown';
import { ExportColumn } from '@/utils/export';
import { formatDate, formatDateTime } from '@/utils/date';

export default function OrdersPage() {
  const [data, setData] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { showToast } = useToast();

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetchWithAuth('/orders');
        if (res.ok) {
          const json = await res.json();
          setData(json.orders || []);
        }
      } catch (err) {
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const columns: Column[] = [
    { key: 'checkbox', label: '', sortable: false, className: 'no-sort' },
    { key: 'order_number', label: 'Order ID', sortable: true },
    { key: 'customer_name', label: 'Customer', sortable: true },
    { key: 'items_count', label: 'Items', sortable: false },
    { key: 'total_amount', label: 'Total Amount', sortable: true },
    { key: 'payment_method', label: 'Payment', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'created_at', label: 'Date', sortable: true },
    { key: 'actions', label: 'Actions', sortable: false, className: 'no-sort' }
  ];

  const filteredData = data.filter(r => !statusFilter || r.status === statusFilter);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetchWithAuth(`/orders/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setData(prev => prev.map(o => String(o.id) === id ? { ...o, status: newStatus } : o));
        showToast(`Order #${id} status updated to ${newStatus}`, 'success');
      } else {
        showToast(`Failed to update status for order #${id}`, 'error');
      }
    } catch (err) {
      showToast(`Error updating order status.`, 'error');
    }
  };

  const handleBulkAction = async (newStatus: string) => {
    if (selectedIds.size === 0) return;
    
    try {
      const promises = Array.from(selectedIds).map(id => 
        fetchWithAuth(`/orders/${id}/status`, {
          method: 'PUT',
          body: JSON.stringify({ status: newStatus })
        })
      );
      
      await Promise.all(promises);
      
      setData(prev => prev.map(o => selectedIds.has(o.id) ? { ...o, status: newStatus } : o));
      showToast(`Marked ${selectedIds.size} orders as ${newStatus}.`, 'success');
      setSelectedIds(new Set());
    } catch (err) {
      showToast('Error performing bulk action.', 'error');
    }
  };

  const renderRow = (row: any, i: number) => {
    const statusMap: Record<string, string> = {
      'Delivered': 'b-success',
      'Shipped': 'b-info',
      'Processing': 'b-gold',
      'Pending': 'b-warning',
      'Cancelled': 'b-danger'
    };
    const cls = statusMap[row.status] || 'b-muted';

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
        <td><strong style={{ color: 'var(--gold)' }}>{row.order_number}</strong></td>
        <td>{row.delivery_name || row.customer_name || 'Guest'}</td>
        <td><span className="badge b-muted">{row.items_count} item{row.items_count > 1 ? 's' : ''}</span></td>
        <td><strong>{row.total_amount}</strong></td>
        <td>{row.payment_method || 'UPI'}</td>
        <td>
          <select
            className={`badge ${cls}`}
            style={{ 
              cursor: 'pointer', 
              border: 'none',
              outline: 'none',
              textAlign: 'center',
              appearance: 'none',
              padding: '4px 10px'
            }}
            value={row.status}
            onChange={(e) => handleStatusChange(String(row.id), e.target.value)}
            title="Click to change status"
          >
            <option value="Pending" style={{ background: 'var(--navy)', color: 'var(--warning)' }}>Pending</option>
            <option value="Processing" style={{ background: 'var(--navy)', color: 'var(--gold)' }}>Processing</option>
            <option value="Shipped" style={{ background: 'var(--navy)', color: 'var(--info)' }}>Shipped</option>
            <option value="Delivered" style={{ background: 'var(--navy)', color: 'var(--success)' }}>Delivered</option>
            <option value="Cancelled" style={{ background: 'var(--navy)', color: 'var(--danger)' }}>Cancelled</option>
          </select>
        </td>
        <td style={{ color: 'var(--muted)', fontSize: '12px' }}>{formatDate(row.created_at)}</td>
        <td>
          <div className="row-actions">
            <button className="act-btn act-view" title="View Order" onClick={() => { setSelectedOrder(row); setViewModalOpen(true); }}>👁</button>
            <button className="act-btn" title="Print Invoice" style={{ fontSize: '14px' }} onClick={() => {
              const w = window.open('', '_blank');
              if (!w) return;
              
              let discountRow = '';
              let subtotalStr = row.total_amount;
              if (row.coupon_code && row.discount_amount) {
                const tot = parseFloat(String(row.total_amount).replace(/[^\d.]/g, '')) || 0;
                const disc = parseFloat(String(row.discount_amount).replace(/[^\d.]/g, '')) || 0;
                subtotalStr = '₹' + (tot + disc).toLocaleString('en-IN');
                discountRow = `<tr><td colspan='2' style='text-align:right'>Discount (${row.coupon_code})</td><td style='color:#D4522A;text-align:right'>-₹${disc.toLocaleString('en-IN')}</td></tr>`;
              }
              
              w.document.write(`<!DOCTYPE html><html><head><title>Invoice #${row.order_number}</title><style>body{font-family:Arial,sans-serif;padding:40px;max-width:700px;margin:0 auto;color:#333}.header{display:flex;justify-content:space-between;border-bottom:2px solid #D4522A;padding-bottom:20px;margin-bottom:30px}h1{color:#D4522A;font-size:28px;margin:0}table{width:100%;border-collapse:collapse;margin:20px 0}th,td{padding:12px;text-align:left;border-bottom:1px solid #eee}th{background:#f9f9f9;font-size:12px;text-transform:uppercase;letter-spacing:0.5px}.total-row{font-weight:bold;font-size:16px;border-top:2px solid #333}.footer{margin-top:40px;padding-top:20px;border-top:1px solid #eee;font-size:12px;color:#777;text-align:center}</style></head><body><div class='header'><div><h1>Chhotu Fashion</h1><p style='margin:4px 0;color:#777;font-size:13px'>GSTIN: 27AABCP1234R1Z5</p></div><div style='text-align:right'><h2 style='margin:0'>INVOICE</h2><p style='margin:4px 0;font-size:13px'>#${row.order_number}</p><p style='margin:4px 0;font-size:13px;color:#777'>${formatDate(row.created_at)}</p></div></div><table><thead><tr><th>Item</th><th>Qty</th><th style='text-align:right'>Amount</th></tr></thead><tbody><tr><td>Apparel & Accessories</td><td>${row.items_count || 1}</td><td style='text-align:right'>${subtotalStr}</td></tr>${discountRow}</tbody><tr class='total-row'><td colspan='2' style='text-align:right'>Total</td><td style='text-align:right'>${row.total_amount}</td></tr></table><p><strong>Payment:</strong> ${row.payment_method || 'UPI'}&nbsp;&nbsp;<strong>Status:</strong> ${row.status}</p><div class='footer'><p>Thank you for shopping with Chhotu Fashion!</p><p>For support: support@chhotufashion.com | +91 98765 43210</p></div></body></html>`);
              w.document.close();
              w.print();
            }}>🖨️</button>
          </div>
        </td>
      </tr>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
        <div className="spinner"></div>
        <div style={{ marginTop: '16px' }}>Loading orders...</div>
      </div>
    );
  }

  return (
    <>
      <div className="admin-card">
        <div className="card-header">
          <div className="card-header-left">
            <div className="card-title-icon">📦</div>
            <span className="card-title">Manage Orders</span>
            <span className="card-count" id="order-count">{filteredData.length}</span>
          </div>
          <div className="card-header-right tbl-controls">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input type="text" placeholder="Search orders…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="filter-sel" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <ExportDropdown 
              data={filteredData}
              filenamePrefix="orders"
              title="Orders Summary Report"
              buttonLabel="Export"
              columns={[
                { key: 'order_number', label: 'Order ID' },
                { key: (row: any) => row.delivery_name || row.customer_name || 'Guest', label: 'Customer Name' },
                { key: (row: any) => `${row.items_count || 1} item${(row.items_count || 1) > 1 ? 's' : ''}`, label: 'Items' },
                { key: 'total_amount', label: 'Amount' },
                { key: (row: any) => row.payment_method || 'UPI', label: 'Payment' },
                { key: 'status', label: 'Status' },
                { key: (row: any) => formatDate(row.created_at), label: 'Date' }
              ]}
            />
          </div>
        </div>

        {selectedIds.size > 0 && (
          <div style={{ padding: '10px 20px', background: 'rgba(212,175,55,0.1)', borderBottom: '1px solid var(--glass-b)', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gold)', marginRight: '10px' }}>{selectedIds.size} selected</span>
            <button className="btn btn-outline btn-sm" onClick={() => handleBulkAction('Processing')}>Mark Processing</button>
            <button className="btn btn-outline btn-sm" onClick={() => handleBulkAction('Shipped')}>Mark Shipped</button>
            <button className="btn btn-outline btn-sm" onClick={() => handleBulkAction('Delivered')}>Mark Delivered</button>
          </div>
        )}

        <div className="card-body">
          {data.length > 0 ? (
            <AdminTable 
              id="ord"
              columns={columns}
              data={filteredData}
              searchFields={['order_number', 'customer_name', 'status', 'payment_method']}
              searchQuery={search}
              perPage={10}
              renderRow={renderRow}
              selectAllId="sa-ord"
              onSelectAll={(checked) => {
                if (checked) setSelectedIds(new Set(filteredData.map(d => d.id)));
                else setSelectedIds(new Set());
              }}
            />
          ) : (
            <div className="empty-state" style={{ padding: '60px 20px' }}>
              <div className="empty-icon" style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
              <h3>No Orders Yet</h3>
              <p style={{ color: 'var(--muted)', marginBottom: '24px' }}>You haven't received any orders yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* View Order Modal */}
      {selectedOrder && (
        <Modal 
          isOpen={viewModalOpen} 
          onClose={() => setViewModalOpen(false)} 
          title={<><span id="orderIcon">📦</span> Order <span style={{ color: 'var(--gold)' }}>{selectedOrder.order_number}</span></>}
          size="lg"
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setViewModalOpen(false)}>Close</button>
              <button className="btn btn-gold" onClick={() => { showToast('Invoice downloaded successfully!', 'success'); setViewModalOpen(false); }}>📄 Download Invoice</button>
            </>
          }
        >
          <div className="od-grid">
            <div className="od-block"><div className="od-label">Customer Name</div><div className="od-val">{selectedOrder.delivery_name || selectedOrder.customer_name || 'Guest'}</div></div>
            <div className="od-block"><div className="od-label">Order Date</div><div className="od-val">{formatDateTime(selectedOrder.created_at)}</div></div>
            <div className="od-block"><div className="od-label">Payment Method</div><div className="od-val">{selectedOrder.payment_method || 'UPI'}</div></div>
            {selectedOrder.coupon_code && (
              <div className="od-block">
                <div className="od-label">Coupon Applied</div>
                <div className="od-val">
                  <span className="badge b-gold" style={{ marginRight: '8px' }}>{selectedOrder.coupon_code}</span>
                  <span style={{ color: 'var(--rose)' }}>-₹{selectedOrder.discount_amount}</span>
                </div>
              </div>
            )}
            <div className="od-block"><div className="od-label">Total Amount</div><div className="od-val" style={{ color: 'var(--gold)' }}>{selectedOrder.total_amount}</div></div>
          </div>
          <div className="od-block" style={{ marginBottom: '16px' }}>
            <div className="od-label">Order Items ({selectedOrder.items_count})</div>
            <div className="od-items">
              {selectedOrder.items && Array.isArray(JSON.parse(selectedOrder.items)) ? JSON.parse(selectedOrder.items).map((item: any, idx: number) => (
                <div className="od-item" key={idx}>
                  <img src={item.img || '/placeholder.png'} alt={item.name} style={{ width: '40px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                  <div className="od-item-info">
                    <div className="od-item-name">{item.name}</div>
                    <div className="od-item-meta">Qty: {item.quantity || 1}</div>
                  </div>
                  <div className="od-item-price">{item.price}</div>
                </div>
              )) : (
                <div className="od-item">
                  <div style={{ fontSize: '24px' }}>👗</div>
                  <div className="od-item-info">
                    <div className="od-item-name">Legacy Order (No item details)</div>
                  </div>
                  <div className="od-item-price">{selectedOrder.total_amount}</div>
                </div>
              )}
            </div>
          </div>
          <div className="od-block">
            <div className="od-label">Shipping Address</div>
            <div className="od-val" style={{ fontSize: '13px', lineHeight: 1.5, color: 'var(--muted)' }}>
              {selectedOrder.delivery_name || selectedOrder.customer_name || 'Guest'}<br/>
              {selectedOrder.shipping_address || 'No address provided'}<br/>
              {selectedOrder.city ? `${selectedOrder.city}` : ''}<br/>
              {selectedOrder.delivery_phone ? `Ph: ${selectedOrder.delivery_phone}` : ''}<br/>
              {selectedOrder.delivery_email ? `Email: ${selectedOrder.delivery_email}` : ''}
            </div>
          </div>
          <div className="od-block" style={{ marginTop: '16px' }}>
            <div className="od-label">Order Timeline</div>
            <div className="timeline">
              <div className="tl-item done"><div className="tl-dot"></div><div className="tl-text"><strong>Order Placed</strong> {formatDateTime(selectedOrder.created_at)}</div></div>
              <div className={`tl-item ${['Processing', 'Shipped', 'Delivered'].includes(selectedOrder.status) ? 'done' : selectedOrder.status === 'Pending' ? 'current' : ''}`}><div className="tl-dot"></div><div className="tl-text"><strong>Payment Confirmed</strong> {selectedOrder.payment_method || 'UPI'}</div></div>
              <div className={`tl-item ${['Shipped', 'Delivered'].includes(selectedOrder.status) ? 'done' : selectedOrder.status === 'Processing' ? 'current' : ''}`}><div className="tl-dot"></div><div className="tl-text"><strong>Processing</strong> Packaging your order</div></div>
              <div className={`tl-item ${selectedOrder.status === 'Delivered' ? 'done' : selectedOrder.status === 'Shipped' ? 'current' : ''}`}><div className="tl-dot"></div><div className="tl-text"><strong>Shipped</strong> Handed over to delivery partner</div></div>
              <div className={`tl-item ${selectedOrder.status === 'Delivered' ? 'current' : ''}`}><div className="tl-dot"></div><div className="tl-text"><strong>Delivered</strong> Successfully delivered to customer</div></div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
