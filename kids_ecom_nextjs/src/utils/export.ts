import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ExportColumn<T = any> {
  key: keyof T | ((row: T) => any);
  label: string;
}

export interface ExportPDFOptions {
  title?: string;
  subtitle?: string;
  orientation?: 'portrait' | 'landscape';
}

function getCellValue<T>(row: T, col: ExportColumn<T>): string {
  let value: any = '';
  if (typeof col.key === 'function') {
    value = col.key(row);
  } else {
    value = row[col.key];
  }
  return value === null || value === undefined ? '' : String(value);
}

/**
 * Export data as a UTF-8 CSV file (with BOM for Excel compatibility)
 */
export function exportToCSV<T>(
  data: T[],
  filename: string,
  columns: ExportColumn<T>[]
) {
  if (!data || !data.length) return;

  const baseName = filename.replace(/\.(csv|xlsx|pdf)$/i, '');
  const finalFileName = `${baseName}.csv`;

  const headerRow = columns.map(c => `"${c.label.replace(/"/g, '""')}"`).join(',');
  
  const rows = data.map(row => {
    return columns.map(c => {
      const val = getCellValue(row, c);
      return `"${val.replace(/"/g, '""')}"`;
    }).join(',');
  });

  // \uFEFF BOM ensures Excel interprets UTF-8 correctly (currency symbols, etc.)
  const csvContent = '\uFEFF' + [headerRow, ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', finalFileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export data as an Excel .xlsx workbook
 */
export function exportToExcel<T>(
  data: T[],
  filename: string,
  columns: ExportColumn<T>[],
  sheetName: string = 'Sheet1'
) {
  if (!data || !data.length) return;

  const baseName = filename.replace(/\.(csv|xlsx|pdf)$/i, '');
  const finalFileName = `${baseName}.xlsx`;

  const headers = columns.map(c => c.label);
  const rows = data.map(row => columns.map(c => getCellValue(row, c)));

  const matrix = [headers, ...rows];
  const worksheet = XLSX.utils.aoa_to_sheet(matrix);

  // Auto-size columns based on maximum cell content length
  const colWidths = headers.map((header, colIndex) => {
    let maxLen = header.length;
    rows.forEach(row => {
      const cellLen = String(row[colIndex] || '').length;
      if (cellLen > maxLen) maxLen = cellLen;
    });
    return { wch: Math.min(Math.max(maxLen + 4, 12), 45) };
  });
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.substring(0, 31));

  XLSX.writeFile(workbook, finalFileName);
}

/**
 * Export data as a styled PDF document
 */
export function exportToPDF<T>(
  data: T[],
  filename: string,
  columns: ExportColumn<T>[],
  options?: ExportPDFOptions
) {
  if (!data || !data.length) return;

  const baseName = filename.replace(/\.(csv|xlsx|pdf)$/i, '');
  const finalFileName = `${baseName}.pdf`;

  // Choose orientation: landscape if more than 5 columns, else portrait
  const orientation = options?.orientation || (columns.length > 5 ? 'landscape' : 'portrait');
  const doc = new jsPDF({
    orientation,
    unit: 'pt',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Document Header
  const title = options?.title || 'Report Export';
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const subtitle = options?.subtitle || `Generated on ${dateStr} at ${timeStr} • Total Records: ${data.length}`;

  // Draw Top Accent Brand Bar
  doc.setFillColor(212, 175, 55); // Gold accent
  doc.rect(0, 0, pageWidth, 5, 'F');

  // Title & Brand Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(20, 26, 46); // Navy dark
  doc.text('Chhotu Fashion Admin', 36, 32);

  doc.setFontSize(13);
  doc.setTextColor(70, 75, 95);
  doc.text(title, 36, 50);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(120, 130, 150);
  doc.text(subtitle, 36, 66);

  // Line separator
  doc.setDrawColor(225, 230, 240);
  doc.setLineWidth(1);
  doc.line(36, 75, pageWidth - 36, 75);

  const headers = [columns.map(c => c.label)];
  const body = data.map(row => columns.map(c => getCellValue(row, c)));

  autoTable(doc, {
    head: headers,
    body: body,
    startY: 85,
    margin: { left: 36, right: 36, bottom: 45 },
    theme: 'grid',
    headStyles: {
      fillColor: [20, 26, 46], // Deep navy
      textColor: [212, 175, 55], // Gold
      fontSize: 9.5,
      fontStyle: 'bold',
      halign: 'left',
      cellPadding: 6
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [40, 45, 60],
      cellPadding: 5.5
    },
    alternateRowStyles: {
      fillColor: [248, 250, 253]
    },
    styles: {
      overflow: 'linebreak',
      lineColor: [230, 235, 245],
      lineWidth: 0.5
    },
    didDrawPage: (dataInfo) => {
      // Footer: Page Number & Timestamp
      const pageCount = (doc.internal as any).getNumberOfPages ? (doc.internal as any).getNumberOfPages() : dataInfo.pageNumber;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(150, 155, 170);
      
      const footerText = `Page ${dataInfo.pageNumber} • Chhotu Fashion Store Management`;
      doc.text(footerText, 36, pageHeight - 20);
      doc.text(`Confidential • For Internal Use Only`, pageWidth - 36, pageHeight - 20, { align: 'right' });
    }
  });

  doc.save(finalFileName);
}
