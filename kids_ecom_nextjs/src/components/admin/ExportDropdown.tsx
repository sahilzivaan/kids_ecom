'use client';

import { useState, useRef, useEffect } from 'react';
import { exportToCSV, exportToExcel, exportToPDF, ExportColumn } from '@/utils/export';
import { useToast } from './Toast';

interface ExportDropdownProps<T = any> {
  data: T[];
  columns: ExportColumn<T>[];
  filenamePrefix: string;
  title?: string;
  buttonLabel?: string;
  pdfOrientation?: 'portrait' | 'landscape';
  className?: string;
  disabled?: boolean;
}

export default function ExportDropdown<T>({
  data,
  columns,
  filenamePrefix,
  title,
  buttonLabel = 'Export',
  pdfOrientation,
  className = 'btn btn-outline btn-sm',
  disabled = false
}: ExportDropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  // Close dropdown on outside click or escape key
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    if (open) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    setOpen(false);
    if (!data || data.length === 0) {
      showToast('⚠️ No records to export.', 'warning');
      return;
    }

    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `${filenamePrefix}_${timestamp}`;
    const reportTitle = title || `${filenamePrefix.charAt(0).toUpperCase() + filenamePrefix.slice(1)} Report`;

    try {
      if (format === 'csv') {
        showToast(`📄 Exporting ${data.length} records to CSV...`, 'info');
        exportToCSV(data, `${filename}.csv`, columns);
      } else if (format === 'excel') {
        showToast(`📊 Exporting ${data.length} records to Excel (.xlsx)...`, 'info');
        exportToExcel(data, `${filename}.xlsx`, columns, reportTitle);
      } else if (format === 'pdf') {
        showToast(`📕 Generating PDF report for ${data.length} records...`, 'info');
        exportToPDF(data, `${filename}.pdf`, columns, {
          title: reportTitle,
          orientation: pdfOrientation
        });
      }
    } catch (err) {
      console.error('Export error:', err);
      showToast('❌ Export failed. Please try again.', 'error');
    }
  };

  return (
    <div 
      ref={dropdownRef} 
      className="export-dropdown-wrapper" 
      style={{ position: 'relative', display: 'inline-block' }}
    >
      <button
        type="button"
        className={`${className} export-main-btn`}
        onClick={() => !disabled && setOpen(prev => !prev)}
        disabled={disabled}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          userSelect: 'none',
          whiteSpace: 'nowrap'
        }}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <span>📥 {buttonLabel}</span>
        <span 
          style={{ 
            fontSize: '10px', 
            transition: 'transform 0.2s ease', 
            transform: open ? 'rotate(180deg)' : 'none',
            opacity: 0.85
          }}
        >
          ▼
        </span>
      </button>

      {open && (
          <div
          className="export-dropdown-menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            backgroundColor: 'var(--indigo)',
            border: '1px solid var(--gold-border)',
            borderRadius: '10px',
            padding: '6px',
            width: '260px',
            minWidth: '260px',
            maxWidth: '280px',
            zIndex: 999999,
            boxShadow: 'var(--shadow)',
            animation: 'dropdownFadeIn 0.15s ease-out'
          }}
        >
          <div style={{
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            color: 'var(--gold)',
            padding: '8px 12px 6px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span>✨</span>
            <span>Download Format</span>
          </div>

          {/* Excel */}
          <button
            type="button"
            className="export-menu-item"
            onClick={() => handleExport('excel')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              border: 'none',
              backgroundColor: 'transparent',
              color: 'var(--platinum)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              textAlign: 'left',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
              marginBottom: '3px'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
              e.currentTarget.style.color = 'var(--emerald)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--platinum)';
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '9px', whiteSpace: 'nowrap' }}>
              <span style={{ fontSize: '16px' }}>📊</span>
              <span style={{ fontWeight: 600 }}>Excel Spreadsheet</span>
            </span>
            <span style={{
              fontSize: '11px',
              padding: '2px 7px',
              borderRadius: '4px',
              backgroundColor: 'rgba(16, 185, 129, 0.25)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: 'var(--emerald)',
              fontWeight: 700,
              letterSpacing: '0.4px',
              flexShrink: 0
            }}>
              .XLSX
            </span>
          </button>

          {/* CSV */}
          <button
            type="button"
            className="export-menu-item"
            onClick={() => handleExport('csv')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              border: 'none',
              backgroundColor: 'transparent',
              color: 'var(--platinum)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              textAlign: 'left',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
              marginBottom: '3px'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
              e.currentTarget.style.color = 'var(--sky)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--platinum)';
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '9px', whiteSpace: 'nowrap' }}>
              <span style={{ fontSize: '16px' }}>📄</span>
              <span style={{ fontWeight: 600 }}>CSV Document</span>
            </span>
            <span style={{
              fontSize: '11px',
              padding: '2px 7px',
              borderRadius: '4px',
              backgroundColor: 'rgba(59, 130, 246, 0.25)',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              color: 'var(--blue, #2563EB)',
              fontWeight: 700,
              letterSpacing: '0.4px',
              flexShrink: 0
            }}>
              .CSV
            </span>
          </button>

          {/* PDF */}
          <button
            type="button"
            className="export-menu-item"
            onClick={() => handleExport('pdf')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              border: 'none',
              backgroundColor: 'transparent',
              color: 'var(--platinum)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              textAlign: 'left',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
              e.currentTarget.style.color = 'var(--rose)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--platinum)';
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '9px', whiteSpace: 'nowrap' }}>
              <span style={{ fontSize: '16px' }}>📕</span>
              <span style={{ fontWeight: 600 }}>PDF Document</span>
            </span>
            <span style={{
              fontSize: '11px',
              padding: '2px 7px',
              borderRadius: '4px',
              backgroundColor: 'rgba(239, 68, 68, 0.25)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: 'var(--rose)',
              fontWeight: 700,
              letterSpacing: '0.4px',
              flexShrink: 0
            }}>
              .PDF
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
