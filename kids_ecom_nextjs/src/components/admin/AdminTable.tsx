'use client';

import { useState, useMemo, ReactNode } from 'react';

export type Column = {
  key: string;
  label: string | ReactNode;
  sortable?: boolean;
  className?: string;
};

interface AdminTableProps<T> {
  id: string;
  columns: Column[];
  data: T[];
  searchFields?: (keyof T)[];
  searchQuery?: string;
  filterValue?: string;
  filterField?: keyof T;
  perPage?: number;
  renderRow: (row: T, index: number) => ReactNode;
  onSelectAll?: (checked: boolean) => void;
  selectAllId?: string;
}

export default function AdminTable<T>({
  id,
  columns,
  data,
  searchFields = [],
  searchQuery = '',
  filterValue = 'all',
  filterField,
  perPage = 10,
  renderRow,
  onSelectAll,
  selectAllId,
}: AdminTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<keyof T | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [currentPerPage, setCurrentPerPage] = useState(perPage);

  const filteredData = useMemo(() => {
    let result = [...data];

    // Filter
    if (filterField && filterValue && filterValue !== 'all') {
      result = result.filter(row => {
        const val = String(row[filterField] || '').toLowerCase().replace(/[\s/]+/g, '-');
        return val === filterValue;
      });
    }

    // Search
    if (searchQuery && searchFields.length > 0) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(row => {
        return searchFields.some(f => String(row[f] || '').toLowerCase().includes(q));
      });
    }

    // Sort
    if (sortField) {
      result.sort((a, b) => {
        let va = a[sortField] ?? '';
        let vb = b[sortField] ?? '';
        
        const na = parseFloat(String(va).replace(/[^\d.]/g, ''));
        const nb = parseFloat(String(vb).replace(/[^\d.]/g, ''));
        
        if (!isNaN(na) && !isNaN(nb)) {
          return sortDir === 'asc' ? na - nb : nb - na;
        }
        return sortDir === 'asc'
          ? String(va).localeCompare(String(vb))
          : String(vb).localeCompare(String(va));
      });
    }

    return result;
  }, [data, filterField, filterValue, searchQuery, searchFields, sortField, sortDir]);

  const total = filteredData.length;
  const tp = Math.ceil(total / currentPerPage);
  
  // Ensure current page is valid
  if (currentPage > tp && tp > 0) setCurrentPage(tp);
  if (currentPage === 0 && tp > 0) setCurrentPage(1);

  const start = (currentPage - 1) * currentPerPage;
  const end = Math.min(start + currentPerPage, total);
  const slice = filteredData.slice(start, end);

  const handleSort = (key: keyof T) => {
    if (sortField === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(key);
      setSortDir('asc');
    }
    setCurrentPage(1);
  };

  const getSortClass = (key: string) => {
    if (sortField !== key) return '';
    return sortDir === 'asc' ? 'sort-asc' : 'sort-desc';
  };

  const goTo = (p: number) => {
    if (p >= 1 && p <= tp) {
      setCurrentPage(p);
    }
  };

  return (
    <>
      <div className="tbl-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`${!col.sortable ? 'no-sort' : ''} ${getSortClass(col.key)} ${col.className || ''}`}
                  onClick={() => col.sortable && handleSort(col.key as keyof T)}
                  style={col.sortable ? { cursor: 'pointer' } : {}}
                >
                  {col.key === 'checkbox' ? (
                    <input 
                      type="checkbox" 
                      id={selectAllId} 
                      onChange={(e) => onSelectAll?.(e.target.checked)} 
                    />
                  ) : col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <div className="empty-state">
                    <div className="empty-icon">🔍</div>
                    <h3>No results found</h3>
                    <p>Try adjusting your search or filter criteria</p>
                  </div>
                </td>
              </tr>
            ) : (
              slice.map((row, i) => renderRow(row, start + i))
            )}
          </tbody>
        </table>
      </div>
      
      <div className="card-footer">
        <div className="tbl-info">
          {total === 0 ? (
            'No results found'
          ) : (
            <>Showing <span>{start + 1}–{end}</span> of <span>{total}</span> results</>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select 
            className="per-page-sel" 
            value={currentPerPage} 
            onChange={e => {
              setCurrentPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            <option value="5">5 / page</option>
            <option value="10">10 / page</option>
            <option value="15">15 / page</option>
            <option value="25">25 / page</option>
            <option value="50">50 / page</option>
          </select>
          
          <div className="pagination">
            {tp > 1 && (
              <>
                <button 
                  className="page-btn" 
                  onClick={() => goTo(currentPage - 1)} 
                  disabled={currentPage === 1}
                >
                  &#8249;
                </button>
                
                {(() => {
                  let html = [];
                  let s = Math.max(1, currentPage - 2);
                  let e = Math.min(tp, s + 4);
                  if (e - s < 4) s = Math.max(1, e - 4);
                  
                  if (s > 1) {
                    html.push(<button key="1" className="page-btn" onClick={() => goTo(1)}>1</button>);
                    if (s > 2) html.push(<button key="ellipsis1" className="page-btn" disabled>…</button>);
                  }
                  for (let i = s; i <= e; i++) {
                    html.push(
                      <button 
                        key={i} 
                        className={`page-btn ${i === currentPage ? 'active' : ''}`}
                        onClick={() => goTo(i)}
                      >
                        {i}
                      </button>
                    );
                  }
                  if (e < tp) {
                    if (e < tp - 1) html.push(<button key="ellipsis2" className="page-btn" disabled>…</button>);
                    html.push(<button key={tp} className="page-btn" onClick={() => goTo(tp)}>{tp}</button>);
                  }
                  return html;
                })()}

                <button 
                  className="page-btn" 
                  onClick={() => goTo(currentPage + 1)} 
                  disabled={currentPage >= tp}
                >
                  &#8250;
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
