'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { fetchPublic } from '@/utils/api';
import { getImageUrl } from '@/utils/image';
import { toast } from '@/utils/toast';
import { formatDate, formatDateTime } from '@/utils/date';

function TrackContent() {
  const searchParams = useSearchParams();
  const queryId = searchParams.get('id') || searchParams.get('order') || '';
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);

  const performTrack = (targetId: string) => {
    const trimmed = targetId.trim();
    if (!trimmed) return;
    setLoading(true);
    setOrderData(null);
    
    fetchPublic(`/track/${encodeURIComponent(trimmed)}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        setLoading(false);
        if (data && data.order) {
          setOrderData(data.order);
          setTimeout(() => {
            const resultEl = document.getElementById('track-result');
            if (resultEl) resultEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 100);
        } else {
          toast.error('Order not found. Please check your order ID.');
        }
      })
      .catch(() => {
        setLoading(false);
        toast.error('An error occurred while tracking the order.');
      });
  };

  useEffect(() => {
    if (queryId) {
      setOrderId(queryId);
      performTrack(queryId);
    }
  }, [queryId]);

  const trackOrder = (e: React.FormEvent) => {
    e.preventDefault();
    performTrack(orderId);
  };

  const getTimeline = (status: string, createdAt: string, updatedAt: string) => {
    const isCancelled = status === 'Cancelled';
    const isPending = status === 'Pending';
    const isProcessing = status === 'Processing';
    const isShipped = status === 'Shipped';
    const isDelivered = status === 'Delivered';

    const placedDate = formatDateTime(createdAt);
    const updatedDate = formatDateTime(updatedAt);

    if (isCancelled) {
      return [
        { status: 'done', icon: '✓', step: 'Order Placed', meta: placedDate },
        { status: 'active', icon: '✕', step: 'Order Cancelled', meta: updatedDate },
      ];
    }

    return [
      { 
        status: 'done', 
        icon: '✓', 
        step: 'Order Placed', 
        meta: placedDate 
      },
      { 
        status: isProcessing || isShipped || isDelivered ? 'done' : 'active', 
        icon: isProcessing || isShipped || isDelivered ? '✓' : '⚙️', 
        step: 'Processing', 
        meta: isProcessing || isShipped || isDelivered ? (isPending ? '' : updatedDate) : 'We are preparing your order' 
      },
      { 
        status: isShipped || isDelivered ? 'done' : (isProcessing ? 'active' : 'pending'), 
        icon: isShipped || isDelivered ? '✓' : (isProcessing ? '📦' : '📦'), 
        step: 'Shipped', 
        meta: isShipped || isDelivered ? updatedDate : (isProcessing ? 'Expected soon' : 'Pending') 
      },
      { 
        status: isDelivered ? 'done' : (isShipped ? 'active' : 'pending'), 
        icon: isDelivered ? '✓' : '🏠', 
        step: 'Delivered', 
        meta: isDelivered ? updatedDate : 'Estimated' 
      },
    ];
  };

  return (
    <main id="main-content">
      <style>{`
        .track-section { padding: 60px 0 80px; background: var(--bg); min-height: 70vh; }
        .track-search-card { background: #fff; border-radius: var(--radius-lg); border: 1px solid var(--border); padding: 40px; max-width: 600px; margin: 0 auto 48px; box-shadow: var(--shadow-md); }
        .track-search-card h2 { font-family: var(--font-serif); font-size: 22px; color: var(--text-heading); margin-bottom: 6px; }
        .track-search-card p { font-size: 14px; color: var(--text-muted); margin-bottom: 24px; }
        .track-form { display: flex; gap: 12px; }
        .track-input { flex: 1; padding: 13px 20px; border-radius: var(--radius-full); border: 1.5px solid var(--border); font-size: 14px; color: var(--text-heading); background: var(--bg); outline: none; transition: var(--transition); }
        .track-input:focus { border-color: var(--primary); background: #fff; box-shadow: 0 0 0 3px rgba(212,82,42,0.08); }
        .btn-track-submit { padding: 13px 28px; border-radius: var(--radius-full); background: var(--primary); color: #fff; font-size: 14px; font-weight: 600; border: none; cursor: pointer; transition: var(--transition); white-space: nowrap; }
        .btn-track-submit:hover { background: var(--primary-dark); }
        .track-result { max-width: 700px; margin: 0 auto; }
        .track-order-info { background: #fff; border-radius: var(--radius-md); border: 1px solid var(--border); padding: 28px; margin-bottom: 20px; box-shadow: var(--shadow-sm); }
        .track-order-meta { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px; margin-bottom: 24px; }
        .track-order-id { font-family: var(--font-serif); font-size: 22px; font-weight: 700; color: var(--text-heading); }
        .track-tracking-id { font-size: 13px; color: var(--primary); font-weight: 600; margin-top: 2px; }
        .track-order-date { font-size: 13px; color: var(--text-muted); margin-top: 3px; }
        .track-status-badge { padding: 8px 18px; border-radius: var(--radius-full); font-size: 12px; font-weight: 700; letter-spacing: 0.5px; background: #EEF4FF; color: #3B82F6; }
        .track-status-badge.cancelled { background: #FEE2E2; color: #EF4444; }
        .track-status-badge.delivered { background: #D1FAE5; color: #10B981; }
        .track-items { display: flex; gap: 14px; padding-top: 20px; border-top: 1px solid var(--border); flex-wrap: wrap; }
        .track-item-chip { display: flex; align-items: center; gap: 10px; background: var(--bg-subtle); border-radius: var(--radius-sm); padding: 10px 14px; border: 1px solid var(--border); }
        .track-item-chip img { object-fit: cover; border-radius: 4px; }
        .track-item-chip span { font-size: 13px; color: var(--text-heading); font-weight: 500; }
        .timeline-card { background: #fff; border-radius: var(--radius-md); border: 1px solid var(--border); padding: 32px; box-shadow: var(--shadow-sm); }
        .timeline-card h3 { font-family: var(--font-serif); font-size: 20px; color: var(--text-heading); margin-bottom: 32px; }
        .timeline-track { display: flex; flex-direction: column; gap: 0; }
        .timeline-item2 { display: flex; gap: 20px; padding-bottom: 36px; position: relative; }
        .timeline-item2:last-child { padding-bottom: 0; }
        .timeline-left2 { display: flex; flex-direction: column; align-items: center; }
        .timeline-dot2 { width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 16px; z-index: 1; transition: all 0.3s ease; }
        .timeline-dot2.done   { background: #27AE60; color: #fff; box-shadow: 0 0 0 6px rgba(39,174,96,0.15); }
        .timeline-dot2.active { background: #3B82F6; color: #fff; box-shadow: 0 0 0 6px rgba(59,130,246,0.15); animation: pulse2 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        .timeline-dot2.active.Cancelled { background: #EF4444; box-shadow: 0 0 0 6px rgba(239,68,68,0.15); animation: pulse2-cancel 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        .timeline-dot2.pending { background: var(--bg); color: var(--text-light); border: 2px dashed var(--border); }
        @keyframes pulse2 { 0%,100%{box-shadow:0 0 0 6px rgba(59,130,246,0.15)} 50%{box-shadow:0 0 0 10px rgba(59,130,246,0.05)} }
        @keyframes pulse2-cancel { 0%,100%{box-shadow:0 0 0 6px rgba(239,68,68,0.15)} 50%{box-shadow:0 0 0 10px rgba(239,68,68,0.05)} }
        .timeline-line2 { width: 2px; flex: 1; background: var(--border); margin: 6px 0; min-height: 40px; }
        .timeline-line2.done { background: #27AE60; }
        .timeline-content2 { padding-top: 8px; flex: 1; }
        .timeline-step2 { font-size: 16px; font-weight: 700; color: var(--text-heading); margin-bottom: 4px; transition: color 0.3s; }
        .timeline-step2.pending-txt { color: var(--text-muted); font-weight: 500; }
        .timeline-meta2 { font-size: 13.5px; color: var(--text-muted); }
        .timeline-meta2.active-txt { color: #3B82F6; font-weight: 600; }
        @media (max-width: 768px) {
          .track-search-card { padding: 28px 24px; }
          .track-section { padding: 40px 0 60px; }
          .track-order-info { padding: 20px; }
          .timeline-card { padding: 24px 20px; }
          .track-result { padding: 0; }
        }
        @media (max-width: 680px) {
          .track-form { flex-direction: column; }
          .btn-track-submit { border-radius: var(--radius-sm); }
          .track-search-card { max-width: 100%; padding: 24px 18px; }
          .track-order-meta { flex-direction: column; gap: 12px; }
        }
        @media (max-width: 480px) {
          .track-search-card { padding: 20px 14px; }
          .track-order-info { padding: 16px; }
          .track-items { gap: 10px; }
          .track-item-chip { padding: 8px 10px; font-size: 12px; }
          .timeline-card { padding: 20px 14px; }
          .timeline-dot2 { width: 34px; height: 34px; font-size: 13px; }
          .timeline-item2 { gap: 14px; }
        }
      `}</style>

      <section style={{ background: 'linear-gradient(135deg, rgba(212,82,42,0.06) 0%, rgba(212,82,42,0.01) 100%)', padding: '40px 0 28px', borderBottom: '1px solid rgba(212,82,42,0.1)' }}>
        <div className="container">
          <span className="section-label">Delivery Updates</span>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(26px,4vw,40px)', color: 'var(--text-heading)', marginBottom: '6px' }}>Track Your Order</h1>
          <p style={{ fontSize: '15px', color: 'var(--text-muted)' }}>Enter your order ID or tracking number below to get real-time delivery status.</p>
        </div>
      </section>

      <section className="track-section">
        <div className="container">
          <div className="track-search-card">
            <h2>Enter Order Details</h2>
            <p>Find your order ID or tracking number in the confirmation email or your account dashboard.</p>
            <form className="track-form" onSubmit={trackOrder}>
              <input className="track-input" type="text" id="order-input" placeholder="e.g. CF-20845 or TRK-10293847" value={orderId} onChange={e => setOrderId(e.target.value)} />
              <button className="btn-track-submit" type="submit" disabled={loading}>{loading ? 'Tracking…' : 'Track Order'}</button>
            </form>
          </div>

          {orderData && (
            <div className="track-result" id="track-result">
              <div className="track-order-info">
                <div className="track-order-meta">
                  <div>
                    <p className="track-order-id">#{orderData.order_number}</p>
                    {orderData.tracking_number && (
                      <p className="track-tracking-id">Tracking #: {orderData.tracking_number}</p>
                    )}
                    <p className="track-order-date">Placed on {formatDate(orderData.created_at)} · {orderData.total_amount}</p>
                  </div>
                  <span className={`track-status-badge ${orderData.status.toLowerCase()}`}>
                    {orderData.status === 'Delivered' ? '✅' : orderData.status === 'Cancelled' ? '❌' : '📦'} {orderData.status}
                  </span>
                </div>
                <div className="track-items">
                  {(() => {
                    let items = [];
                    try { items = JSON.parse(orderData.items) || []; } catch(e) {}
                    return items.map((item: any, idx: number) => (
                      <div className="track-item-chip" key={idx}>
                        {item.img && <img src={getImageUrl(item.img, 'thumb')} alt={item.name} width="40" height="48" />}
                        <span>{item.name} {item.quantity > 1 ? `(x${item.quantity})` : ''}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              <div className="timeline-card">
                <h3>Delivery Timeline</h3>
                <div className="timeline-track">
                  {getTimeline(orderData.status, orderData.created_at, orderData.updated_at).map((t, i, arr) => (
                    <div className="timeline-item2" key={i}>
                      <div className="timeline-left2">
                        <div className={`timeline-dot2 ${t.status} ${orderData.status === 'Cancelled' ? 'Cancelled' : ''}`}>{t.icon}</div>
                        {i < arr.length - 1 && <div className={`timeline-line2 ${t.status === 'done' ? 'done' : ''}`}></div>}
                      </div>
                      <div className="timeline-content2">
                        <p className={`timeline-step2${t.status === 'pending' ? ' pending-txt' : ''}`}>{t.step}</p>
                        <p className={`timeline-meta2${t.status === 'active' ? ' active-txt' : ''}`}>{t.meta}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}>
      <TrackContent />
    </Suspense>
  );
}
