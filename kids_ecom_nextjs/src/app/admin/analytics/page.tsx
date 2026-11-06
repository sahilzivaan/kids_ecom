'use client';

import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/utils/api';
import ExportDropdown from '@/components/admin/ExportDropdown';
import dynamic from 'next/dynamic';

const Line = dynamic(() => import('@/components/admin/Charts').then(m => m.Line), { ssr: false });
const Bar = dynamic(() => import('@/components/admin/Charts').then(m => m.Bar), { ssr: false });
const Doughnut = dynamic(() => import('@/components/admin/Charts').then(m => m.Doughnut), { ssr: false });

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<number[]>(new Array(12).fill(0));
  const [ordersDataArr, setOrdersDataArr] = useState<number[]>(new Array(12).fill(0));
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    revChange: 0,
    avgOrder: 0,
    aovChange: 0,
    conversion: 0,
    convChange: 0
  });
  const [period, setPeriod] = useState('12m');
  const [categoryDataArr, setCategoryDataArr] = useState<number[]>([40, 30, 20, 10]);
  const [cityDataArr, setCityDataArr] = useState<number[]>([150, 120, 90, 60, 40]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const res = await fetchWithAuth(`/analytics?period=${period}`);
        if (res.ok) {
          const json = await res.json();
          if (json.revenueData) setRevenueData(json.revenueData);
          if (json.ordersData) setOrdersDataArr(json.ordersData);
          if (json.metrics) setMetrics(json.metrics);
          if (json.categoryData) setCategoryDataArr(json.categoryData);
          if (json.cityData) setCityDataArr(json.cityData);
        }
      } catch (err) {
        // Leave defaults on error
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [period]);

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

  const ordersData = {
    labels: months,
    datasets: [{
      label: 'Orders',
      data: ordersDataArr,
      backgroundColor: '#38BDF8',
      borderRadius: 4,
    }]
  };

  const ordersOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#8B83A0' } },
      y: { grid: { color: 'rgba(255,255,255,.05)' }, ticks: { color: '#8B83A0' } }
    }
  };

  const catData = {
    labels: ['Girls', 'Boys', 'Baby', 'Ethnic'],
    datasets: [{
      data: categoryDataArr,
      backgroundColor: ['#D4AF37', '#38BDF8', '#10B981', '#F59E0B'],
      borderWidth: 0
    }]
  };

  const cityData = {
    labels: ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Pune'],
    datasets: [{
      label: 'Orders',
      data: cityDataArr,
      backgroundColor: '#38BDF8',
      borderRadius: 4,
    }]
  };

  const cityOptions: any = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,.05)' }, ticks: { color: '#8B83A0' } },
      y: { grid: { display: false }, ticks: { color: '#8B83A0' } }
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
        <div className="spinner"></div>
        <div style={{ marginTop: '16px' }}>Loading analytics...</div>
      </div>
    );
  }

  return (
    <>
      <div className="sec-hdr">
        <div>
          <h1 className="sec-title">Sales Analytics</h1>
          <p className="sec-sub">Detailed breakdown of revenue, traffic, and conversion metrics.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <select className="filter-sel" style={{ padding: '8px 12px' }} value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="ytd">This Year</option>
            <option value="12m">Last 12 Months</option>
          </select>
          <ExportDropdown 
            data={[
              { metric: 'Total Revenue', value: `₹${metrics.totalRevenue.toLocaleString('en-IN')}`, change: `${metrics.revChange >= 0 ? '+' : ''}${metrics.revChange}%` },
              { metric: 'Average Order Value', value: `₹${metrics.avgOrder.toLocaleString('en-IN')}`, change: `${metrics.aovChange >= 0 ? '+' : ''}${metrics.aovChange}%` },
              { metric: 'Conversion Rate', value: `${metrics.conversion}%`, change: `${metrics.convChange >= 0 ? '+' : ''}${metrics.convChange}%` },
              ...['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, idx) => ({
                metric: `Monthly Revenue - ${m}`,
                value: `₹${(revenueData[idx] || 0).toLocaleString('en-IN')}`,
                change: `${ordersDataArr[idx] || 0} orders`
              }))
            ]}
            filenamePrefix={`analytics_report_${period}`}
            title={`Sales & Revenue Analytics Report (${period.toUpperCase()})`}
            buttonLabel="Export Report"
            columns={[
              { key: 'metric', label: 'Metric / Month' },
              { key: 'value', label: 'Value / Revenue' },
              { key: 'change', label: 'Growth / Orders' }
            ]}
          />
        </div>
      </div>

      <div className="a-row a-row-3">
        <div className="admin-card">
          <div className="card-body" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ color: 'var(--muted)', fontSize: '13px' }}>Total Revenue</div>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--gold-dim)', color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>💰</div>
            </div>
            <div style={{ fontSize: '28px', color: 'var(--gold)', fontWeight: 700, fontFamily: "'Outfit',sans-serif" }}>₹{metrics.totalRevenue.toLocaleString('en-IN')}</div>
            <div style={{ fontSize: '12px', marginTop: '6px' }}>
              <span style={{ color: metrics.revChange >= 0 ? 'var(--emerald)' : 'var(--rose)' }}>
                {metrics.revChange >= 0 ? '↑' : '↓'} {Math.abs(metrics.revChange)}%
              </span> vs previous period
            </div>
          </div>
        </div>
        <div className="admin-card">
          <div className="card-body" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ color: 'var(--muted)', fontSize: '13px' }}>Average Order Value</div>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--gold-dim)', color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🛒</div>
            </div>
            <div style={{ fontSize: '28px', color: 'var(--platinum)', fontWeight: 700, fontFamily: "'Outfit',sans-serif" }}>₹{metrics.avgOrder.toLocaleString('en-IN')}</div>
            <div style={{ fontSize: '12px', marginTop: '6px' }}>
              <span style={{ color: metrics.aovChange >= 0 ? 'var(--emerald)' : 'var(--rose)' }}>
                {metrics.aovChange >= 0 ? '↑' : '↓'} {Math.abs(metrics.aovChange)}%
              </span> vs previous period
            </div>
          </div>
        </div>
        <div className="admin-card">
          <div className="card-body" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ color: 'var(--muted)', fontSize: '13px' }}>Conversion Rate</div>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--gold-dim)', color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>📈</div>
            </div>
            <div style={{ fontSize: '28px', color: 'var(--platinum)', fontWeight: 700, fontFamily: "'Outfit',sans-serif" }}>{metrics.conversion}%</div>
            <div style={{ fontSize: '12px', marginTop: '6px' }}>
              <span style={{ color: metrics.convChange >= 0 ? 'var(--emerald)' : 'var(--rose)' }}>
                {metrics.convChange >= 0 ? '↑' : '↓'} {Math.abs(metrics.convChange)}%
              </span> vs previous period
            </div>
          </div>
        </div>
      </div>

      <div className="a-row">
        <div className="admin-card">
          <div className="card-header">
            <div className="card-header-left">
              <span className="card-title">Revenue Trend</span>
            </div>
          </div>
          <div className="card-body">
            <div className="chart-wrap" style={{ height: '300px' }}>
              <Line data={revData} options={revOptions} />
            </div>
          </div>
        </div>

        <div className="admin-card">
          <div className="card-header">
            <div className="card-header-left">
              <span className="card-title">Orders Volume</span>
            </div>
          </div>
          <div className="card-body">
            <div className="chart-wrap" style={{ height: '300px' }}>
              <Bar data={ordersData} options={ordersOptions} />
            </div>
          </div>
        </div>
      </div>

      <div className="a-row a-row-3" style={{ marginTop: '20px' }}>
        <div className="admin-card">
          <div className="card-header"><span className="card-title">Category Sales</span></div>
          <div className="card-body">
            <div className="chart-wrap" style={{ height: '240px', padding: '10px' }}>
              <Doughnut data={catData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#8B83A0' } } } }} />
            </div>
          </div>
        </div>
        <div className="admin-card">
          <div className="card-header"><span className="card-title">Top Cities</span></div>
          <div className="card-body">
            <div className="chart-wrap" style={{ height: '240px' }}>
              <Bar data={cityData} options={cityOptions} />
            </div>
          </div>
        </div>
        <div className="admin-card">
          <div className="card-header"><span className="card-title">Customer Retention</span></div>
          <div className="card-body" style={{ padding: '22px' }}>
             <div style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '8px' }}>Repeat Customer Rate</div>
             <div style={{ fontSize: '28px', color: 'var(--emerald)', fontWeight: 700, fontFamily: "'Outfit',sans-serif" }}>24.5%</div>
             <div style={{ fontSize: '12px', marginTop: '6px' }}>↑ 2.1% vs previous period</div>
             
             <div style={{ color: 'var(--muted)', fontSize: '13px', marginTop: '20px', marginBottom: '8px' }}>Abandoned Cart Rate</div>
             <div style={{ fontSize: '28px', color: 'var(--rose)', fontWeight: 700, fontFamily: "'Outfit',sans-serif" }}>68.2%</div>
             <div style={{ fontSize: '12px', marginTop: '6px' }}>↓ 1.5% vs previous period</div>
          </div>
        </div>
      </div>
    </>
  );
}
