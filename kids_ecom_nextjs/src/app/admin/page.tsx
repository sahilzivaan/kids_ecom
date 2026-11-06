'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchWithAuth } from '@/utils/api';
import { KPI, Order, Product } from '@/types';
import AdminTable, { Column } from '@/components/admin/AdminTable';
import ExportDropdown from '@/components/admin/ExportDropdown';
import { formatDate } from '@/utils/date';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

export default function Dashboard() {
  const [roSearch, setRoSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [topProducts, setTopProducts] = useState<Product[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<number[]>(new Array(12).fill(0));
  const [statusDataArr, setStatusDataArr] = useState<number[]>([0, 0, 0, 0, 0]);
  const [hoveredProductIndex, setHoveredProductIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetchWithAuth('/dashboard');
        if (res.ok) {
          const json = await res.json();
          setKpis(json.kpis || []);
          setRecentOrders(json.recentOrders || []);
          setTopProducts(json.topProducts || []);
          if (json.revenueData) setRevenueData(json.revenueData);
          if (json.statusData) setStatusDataArr(json.statusData);
        }
      } catch (err) {
        // Fallback to empty state on error (API not ready)
        setKpis([
          { label: 'Total Revenue', value: '₹0', change: '0%', dir: 'up', icon: '💰', spark: 'M0,32 L100,32' },
          { label: 'Orders Today', value: '0', change: '0%', dir: 'up', icon: '📦', spark: 'M0,30 L100,30' },
          { label: 'Active Customers', value: '0', change: '0%', dir: 'up', icon: '👥', spark: 'M0,28 L100,28' },
          { label: 'Pending Shipments', value: '0', change: '0%', dir: 'down', icon: '🚚', spark: 'M0,10 L100,10' }
        ]);
        // Mock low stock for demo
        setLowStockProducts([{ id: 101, name: 'Girls Floral Dress', stock: 2, sku: 'DR-001' }]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ── Recent Orders Table Columns ──
  const roColumns: Column[] = [
    { key: 'id', label: 'Order ID', sortable: true },
    { key: 'customer', label: 'Customer', sortable: true },
    { key: 'items', label: 'Items', sortable: false },
    { key: 'amount_num', label: 'Amount', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'date', label: 'Date', sortable: true },
  ];

  const renderRoRow = (row: any, index: number) => {
    const statusMap: Record<string, string> = {
      'Delivered': 'b-success',
      'Shipped': 'b-info',
      'Processing': 'b-gold',
      'Pending': 'b-warning',
      'Cancelled': 'b-danger'
    };
    const cls = statusMap[row.status] || 'b-muted';

    return (
      <tr key={index}>
        <td><strong style={{ color: 'var(--gold)' }}>#{row.id}</strong></td>
        <td>{row.customer}</td>
        <td><span className="badge b-muted">{row.items} item{row.items > 1 ? 's' : ''}</span></td>
        <td><strong>{row.amount}</strong></td>
        <td><span className={`badge ${cls}`}>{row.status}</span></td>
        <td style={{ color: 'var(--muted)', fontSize: '12px' }}>{row.date}</td>
      </tr>
    );
  };

  // ── Chart Data ──
  const months = ['Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun'];

  const revData = {
    labels: months,
    datasets: [{
      label: 'Revenue (₹)',
      data: revenueData,
      borderColor: '#D4AF37',
      backgroundColor: 'rgba(212,175,55,.1)',
      borderWidth: 2.5,
      pointBackgroundColor: '#D4AF37',
      pointRadius: 4,
      fill: true,
      tension: 0.4
    }]
  };

  const revOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx: any) => '₹ ' + ctx.parsed.y.toLocaleString('en-IN') } }
    },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,.05)' }, ticks: { color: '#8B83A0' } },
      y: { grid: { color: 'rgba(255,255,255,.05)' }, ticks: { color: '#8B83A0', callback: (v: number) => '₹' + Math.round(v / 1000) + 'k' } }
    }
  };

  const statusData = {
    labels: ['Delivered','Shipped','Processing','Pending','Cancelled'],
    datasets: [{
      data: statusDataArr,
      backgroundColor: ['#10B981','#38BDF8','#D4AF37','#F59E0B','#F87171'],
      borderColor: '#1E1B4B',
      borderWidth: 3,
      hoverOffset: 6
    }]
  };

  const statusOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: { position: 'bottom', labels: { color: '#8B83A0', padding: 14, font: { size: 12 } } },
      tooltip: { callbacks: { label: (ctx: any) => ctx.label + ': ' + ctx.parsed + '%' } }
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
        <div className="spinner"></div>
        <div style={{ marginTop: '16px' }}>Loading dashboard data...</div>
      </div>
    );
  }

  return (
    <>
      {lowStockProducts.length > 0 && (
        <div style={{ padding: '16px 20px', background: 'rgba(248, 113, 113, 0.1)', border: '1px solid var(--rose)', borderRadius: '8px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <div style={{ width: '8px', height: '8px', background: 'var(--rose)', borderRadius: '50%' }}></div>
              <h4 style={{ color: 'var(--rose)', fontSize: '15px', fontWeight: 600, margin: 0 }}>Stock Alert</h4>
            </div>
            <p style={{ color: 'var(--platinum)', fontSize: '13px', margin: '4px 0 0 0' }}>{lowStockProducts.length} product(s) are running low on stock.</p>
          </div>
          <Link href="/admin/products" className="btn btn-outline btn-sm" style={{ borderColor: 'var(--rose)', color: 'var(--rose)' }}>View Products</Link>

        </div>
      )}

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
        {[
          { label: 'Add Product', icon: '➕', href: '/admin/products', color: '#D4AF37' },
          { label: 'View Orders', icon: '📦', href: '/admin/orders', color: '#38BDF8' },
          { label: 'Create Coupon', icon: '🏷️', href: '/admin/coupons', color: '#A78BFA' },
          { label: 'Analytics', icon: '📈', href: '/admin/analytics', color: '#34D399' },
          { label: 'Customers', icon: '👥', href: '/admin/customers', color: '#FB923C' },
        ].map(action => (
          <Link key={action.label} href={action.href} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', background: 'var(--glass-bg)', border: '1px solid var(--glass-b)', borderRadius: '8px', color: action.color, fontWeight: 600, fontSize: '13px', textDecoration: 'none', transition: 'all 0.2s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = action.color; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--glass-bg)'; (e.currentTarget as HTMLElement).style.color = action.color; }}
          >
            <span>{action.icon}</span> {action.label}
          </Link>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        {kpis.map((k, i) => {
          const sparkColor = k.dir === 'up' ? '#D4AF37' : '#F87171';
          return (
            <div key={i} className="kpi-card">
              <div className="kpi-top">
                <div className="kpi-icon">{k.icon}</div>
                <span className={`kpi-change ${k.dir}`}>
                  {k.dir === 'up' ? '↑' : '↓'} {k.change}
                </span>
              </div>
              <div className="kpi-value">{k.value}</div>
              <div className="kpi-label">{k.label}</div>
              <div className="kpi-sparkline">
                <svg viewBox="0 0 100 36" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id={`sg${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={sparkColor} stopOpacity=".5" />
                      <stop offset="100%" stopColor={sparkColor} stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d={k.spark} stroke={sparkColor} className="spark-line" />
                  <path d={`${k.spark} L100,36 L0,36 Z`} fill={`url(#sg${i})`} className="spark-fill" />
                </svg>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="charts-grid">
        <div className="admin-card">
          <div className="card-header">
            <div className="card-header-left">
              <div className="card-title-icon">📈</div>
              <span className="card-title">Revenue Overview</span>
              <span className="card-count">Last 12 months</span>
            </div>
            <div className="card-header-right">
              <span style={{ fontSize: '13px', color: 'var(--muted)' }}>FY {new Date().getFullYear() - 1}–{new Date().getFullYear().toString().slice(-2)}</span>
            </div>
          </div>
          <div className="card-body">
            <div className="chart-wrap">
              <Line data={revData} options={revOptions} />
            </div>
          </div>
        </div>

        <div className="admin-card">
          <div className="card-header">
            <div className="card-header-left">
              <div className="card-title-icon">🎯</div>
              <span className="card-title">Order Status</span>
            </div>
          </div>
          <div className="card-body">
            <div className="chart-wrap">
              <Doughnut data={statusData} options={statusOptions} />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom tables */}
      <div className="dash-grid">
        <div className="admin-card">
          <div className="card-header">
            <div className="card-header-left">
              <div className="card-title-icon">📦</div>
              <span className="card-title">Recent Orders</span>
              <span className="card-count">{recentOrders.length}</span>
            </div>
            <div className="card-header-right">
              <div className="search-box">
                <span className="search-icon">🔍</span>
                <input 
                  type="text" 
                  placeholder="Search orders…" 
                  value={roSearch}
                  onChange={e => setRoSearch(e.target.value)}
                />
              </div>
              <ExportDropdown 
                data={recentOrders}
                filenamePrefix="recent_orders"
                title="Recent Orders Summary"
                buttonLabel="Export"
                className="btn btn-outline btn-sm"
                columns={[
                  { key: 'order_number', label: 'Order ID' },
                  { key: (row: any) => row.delivery_name || row.customer_name || 'Guest', label: 'Customer' },
                  { key: 'total_amount', label: 'Amount' },
                  { key: (row: any) => row.payment_method || 'UPI', label: 'Payment' },
                  { key: 'status', label: 'Status' },
                  { key: (row: any) => formatDate(row.created_at), label: 'Date' }
                ]}
              />
              <Link href="/admin/orders" className="btn btn-outline btn-sm">View All</Link>
            </div>
          </div>
          <div className="card-body">
            {recentOrders.length > 0 ? (
              <AdminTable 
                id="ro"
                columns={roColumns}
                data={recentOrders}
                searchFields={['id', 'customer_name', 'status', 'order_number']}
                searchQuery={roSearch}
                perPage={5}
                renderRow={renderRoRow}
              />
            ) : (
              <div className="empty-state" style={{ padding: '40px 20px' }}>
                <div className="empty-icon">📦</div>
                <h3>No Recent Orders</h3>
                <p>There are no recent orders to display.</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Products Table */}
        <div className="admin-card">
          <div className="card-header">
            <div className="card-header-left">
              <div className="card-title-icon">🏆</div>
              <span className="card-title">Best Sellers</span>
            </div>
            <div className="card-header-right">
              <Link href="/admin/products" className="btn btn-outline btn-sm">View All</Link>
            </div>
          </div>
          <div className="card-body">
            {topProducts.length > 0 ? (
              <div className="tbl-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th className="no-sort">#</th>
                      <th className="no-sort">Product</th>
                      <th className="no-sort">Category</th>
                      <th className="no-sort">Units Sold</th>
                      <th className="no-sort">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.slice(0, 5).map((p, i) => (
                      <tr 
                        key={i} 
                        onMouseEnter={() => setHoveredProductIndex(i)}
                        onMouseLeave={() => setHoveredProductIndex(null)}
                      >
                        <td><span className="badge b-gold">{p.rank}</span></td>
                        {hoveredProductIndex === i ? (
                          <td colSpan={4}>
                            <div style={{ fontWeight: 500, fontSize: '13px', padding: '8px 0', whiteSpace: 'normal', wordBreak: 'break-word', color: 'var(--platinum)' }}>
                              {p.name}
                            </div>
                          </td>
                        ) : (
                          <>
                            <td style={{ maxWidth: '10ch' }}>
                              <div 
                                style={{ 
                                  fontWeight: 500, 
                                  fontSize: '13px', 
                                  whiteSpace: 'nowrap', 
                                  overflow: 'hidden', 
                                  textOverflow: 'ellipsis', 
                                  cursor: 'pointer'
                                }}
                              >
                                {p.name}
                              </div>
                            </td>
                            <td><span className="badge b-info">{p.category}</span></td>
                            <td><strong style={{ color: 'var(--emerald)' }}>{p.sold}</strong></td>
                            <td><strong style={{ color: 'var(--gold)' }}>₹{(p.revenue || 0).toLocaleString('en-IN')}</strong></td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '40px 20px' }}>
                <div className="empty-icon">🏆</div>
                <h3>No Data Available</h3>
                <p>Best sellers will appear here once sales are made.</p>
              </div>
            )}
          </div>
          <div className="card-footer" style={{ justifyContent: 'flex-end' }}>
            <Link href="/admin/analytics" className="btn btn-outline btn-sm">Full Analytics →</Link>
          </div>
        </div>
      </div>
    </>
  );
}
