'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/admin/Toast';
import { fetchWithAuth } from '@/utils/api';
import { formatDateTime } from '@/utils/date';
import ExportDropdown from '@/components/admin/ExportDropdown';

export default function EmailLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const { showToast } = useToast();

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/email/logs';
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (search) params.append('search', search);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await fetchWithAuth(url);
      if (res.ok) {
        const json = await res.json();
        setLogs(json.logs || []);
      }
    } catch (err) {
      showToast('❌ Failed to load email logs.', 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, showToast]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  return (
    <>
      <div className="admin-card">
        <div className="card-header">
          <div className="card-header-left">
            <div className="card-title-icon">📜</div>
            <span className="card-title">Email Logs</span>
          </div>
          <div className="card-header-right tbl-controls">
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div className="search-box">
                <span className="search-icon">🔍</span>
                <input 
                  type="text" 
                  placeholder="Search email, name or subject..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select 
                className="form-control" 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ width: '150px' }}
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="sent">Sent</option>
                <option value="failed">Failed</option>
              </select>
              <button type="submit" className="btn btn-gold" style={{ display: 'none' }}>Filter</button>
            </form>
            <ExportDropdown 
              data={logs}
              filenamePrefix="email_logs"
              title="Email Communication Logs"
              buttonLabel="Export"
              className="btn btn-outline"
              columns={[
                { key: (row: any) => formatDateTime(row.created_at), label: 'Date & Time' },
                { key: (row: any) => row.customer_name || 'System', label: 'Recipient Name' },
                { key: 'recipient_email', label: 'Recipient Email' },
                { key: 'subject', label: 'Subject' },
                { key: (row: any) => String(row.status || '').toUpperCase(), label: 'Status' },
                { key: (row: any) => row.error_message || 'None', label: 'Error / Notes' }
              ]}
            />
          </div>
        </div>
        <div className="card-body">

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
            <div className="spinner"></div>
          </div>
        ) : (
          <table className="admin-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ padding: '12px', borderBottom: '1px solid var(--glass-b)' }}>Date</th>
                <th style={{ padding: '12px', borderBottom: '1px solid var(--glass-b)' }}>Recipient</th>
                <th style={{ padding: '12px', borderBottom: '1px solid var(--glass-b)' }}>Subject</th>
                <th style={{ padding: '12px', borderBottom: '1px solid var(--glass-b)' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)' }}>
                    No logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ padding: '12px', borderBottom: '1px solid var(--glass-b)', fontSize: '13px' }}>
                      {formatDateTime(log.created_at)}
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid var(--glass-b)' }}>
                      <div style={{ fontWeight: 600 }}>{log.customer_name || 'System'}</div>
                      <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{log.recipient_email}</div>
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid var(--glass-b)' }}>{log.subject}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid var(--glass-b)' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        backgroundColor: log.status === 'sent' ? 'rgba(46, 213, 115, 0.2)' : 
                                         log.status === 'failed' ? 'rgba(255, 71, 87, 0.2)' : 'rgba(255, 165, 2, 0.2)',
                        color: log.status === 'sent' ? 'var(--emerald)' : 
                               log.status === 'failed' ? 'var(--rose)' : '#ffa502'
                      }}>
                        {log.status.toUpperCase()}
                      </span>
                      {log.error_message && (
                        <div style={{ fontSize: '11px', color: 'var(--rose)', marginTop: '4px', maxWidth: '200px' }}>
                          {log.error_message}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
        </div>
      </div>
    </>
  );
}
