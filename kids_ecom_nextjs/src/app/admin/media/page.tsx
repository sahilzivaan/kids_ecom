'use client';

import { useState, useEffect, useRef } from 'react';
import Modal from '@/components/admin/Modal';
import { useToast } from '@/components/admin/Toast';
import { fetchWithAuth, API_BASE_URL } from '@/utils/api';
import { getImageUrl } from '@/utils/image';
import { formatDate } from '@/utils/date';

export default function MediaLibraryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [formatFilter, setFormatFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const fetchMedia = async () => {
    try {
      const res = await fetchWithAuth('/media');
      if (res.ok) {
        const json = await res.json();
        setItems(json.data || []);
      } else {
        setItems([]);
      }
    } catch (err) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  // Upload handler for files
  const uploadFiles = async (files: File[]) => {
    if (!files || files.length === 0) return;

    const validFiles = files.filter(f => f.type.startsWith('image/'));
    if (validFiles.length === 0) {
      showToast('⚠️ Please select valid image files (JPG, PNG, WEBP, GIF, SVG)', 'warning');
      return;
    }

    let successCount = 0;
    
    for (let i = 0; i < validFiles.length; i++) {
      const f = validFiles[i];
      setUploadProgress(`Uploading image ${i + 1} of ${validFiles.length}: ${f.name}...`);
      
      const fd = new FormData();
      fd.append('files[]', f);

      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
        const baseUrl = API_BASE_URL;
        const res = await fetch(`${baseUrl}/admin/media/upload`, {
          method: 'POST',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          body: fd
        });

        if (res.ok) {
          successCount++;
        }
      } catch (err) {
        console.error('Failed to upload', f.name, err);
      }
    }

    setUploadProgress(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    
    if (successCount > 0) {
      showToast(`✅ Successfully uploaded ${successCount} of ${validFiles.length} media file(s)!`, 'success');
      fetchMedia();
    } else {
      showToast(`❌ All ${validFiles.length} uploads failed.`, 'error');
    }
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFiles(Array.from(e.dataTransfer.files));
    }
  };

  // Delete single media
  const handleDelete = async () => {
    if (!selectedMedia) return;
    try {
      const res = await fetchWithAuth(`/media/${selectedMedia.id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('🗑️ Media file permanently deleted', 'warning');
        setDeleteModalOpen(false);
        setDetailModalOpen(false);
        setSelectedIds(prev => {
          const next = new Set(prev);
          next.delete(selectedMedia.id);
          return next;
        });
        fetchMedia();
      } else {
        showToast('❌ Failed to delete media file', 'error');
      }
    } catch (err) {
      showToast('❌ Error deleting media', 'error');
    }
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setIsDeleting(true);
    const ids = Array.from(selectedIds);
    let successCount = 0;
    let doneCount = 0;

    setDeleteProgress(`Deleting file 0 of ${ids.length}...`);

    try {
      await Promise.all(
        ids.map(async (id) => {
          try {
            const res = await fetchWithAuth(`/media/${id}`, { method: 'DELETE' });
            if (res.ok) successCount++;
          } catch (err) {
            // ignore
          }
          doneCount++;
          setDeleteProgress(`Deleting file ${doneCount} of ${ids.length}...`);
        })
      );
    } catch (err) {
      console.error(err);
    }

    showToast(`🗑️ Deleted ${successCount} media files`, 'warning');
    setSelectedIds(new Set());
    setBulkDeleteModalOpen(false);
    setIsDeleting(false);
    setDeleteProgress(null);
    fetchMedia();
  };

  // Selection toggle
  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredItems.length && filteredItems.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map(i => i.id)));
    }
  };

  // Copy URL helper
  const copyToClipboard = (url: string) => {
    const fullUrl = getImageUrl(url, 'original');
    navigator.clipboard.writeText(fullUrl);
    showToast('📋 Image URL copied to clipboard!', 'info');
  };

  // Filter & Sort
  const filteredItems = items
    .filter(item => {
      const matchesSearch =
        !search ||
        (item.original_name || item.filename || '').toLowerCase().includes(search.toLowerCase());

      const mime = (item.mime_type || '').toLowerCase();
      let matchesFormat = true;
      if (formatFilter === 'webp') matchesFormat = mime.includes('webp');
      else if (formatFilter === 'png') matchesFormat = mime.includes('png');
      else if (formatFilter === 'jpeg') matchesFormat = mime.includes('jpeg') || mime.includes('jpg');
      else if (formatFilter === 'gif') matchesFormat = mime.includes('gif');

      return matchesSearch && matchesFormat;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return Number(b.id) - Number(a.id);
      if (sortBy === 'oldest') return Number(a.id) - Number(b.id);
      if (sortBy === 'size-desc') return Number(b.file_size || 0) - Number(a.file_size || 0);
      if (sortBy === 'size-asc') return Number(a.file_size || 0) - Number(b.file_size || 0);
      if (sortBy === 'name-asc') return (a.original_name || '').localeCompare(b.original_name || '');
      return 0;
    });

  // Calculate Metrics
  const totalBytes = items.reduce((acc, i) => acc + Number(i.file_size || 0), 0);
  const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);
  const webpCount = items.filter(i => (i.mime_type || '').toLowerCase().includes('webp')).length;
  const pngCount = items.filter(i => (i.mime_type || '').toLowerCase().includes('png')).length;
  const jpgCount = items.filter(i => (i.mime_type || '').toLowerCase().includes('jpeg') || (i.mime_type || '').toLowerCase().includes('jpg')).length;

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  if (loading) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--muted)' }}>
        <div className="spinner"></div>
        <div style={{ marginTop: '16px', fontSize: '15px' }}>Loading media library...</div>
      </div>
    );
  }

  return (
    <>
      {/* ── KPI METRICS CARDS ── */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-top">
            <div className="kpi-icon">🖼️</div>
            <span className="kpi-change up">Active</span>
          </div>
          <div className="kpi-value">{items.length}</div>
          <div className="kpi-label">Total Media Files</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <div className="kpi-icon">💾</div>
            <span className="badge b-gold" style={{ fontSize: '10px' }}>Unlimited</span>
          </div>
          <div className="kpi-value">{totalMB} <span style={{ fontSize: '14px', color: 'var(--muted)', fontWeight: 400 }}>MB</span></div>
          <div className="kpi-label">Total Storage Used</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <div className="kpi-icon">⚡</div>
            <span className="badge b-info" style={{ fontSize: '10px' }}>WebP Ready</span>
          </div>
          <div className="kpi-value">{webpCount} <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 400 }}>/ {items.length}</span></div>
          <div className="kpi-label">Optimized WebP Images</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <div className="kpi-icon">🎨</div>
            <span className="badge b-muted" style={{ fontSize: '10px' }}>Formats</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '6px', marginBottom: '8px' }}>
            <span className="media-format-badge" style={{ color: 'var(--sky)' }}>WebP: {webpCount}</span>
            <span className="media-format-badge" style={{ color: 'var(--emerald)' }}>PNG: {pngCount}</span>
            <span className="media-format-badge" style={{ color: 'var(--gold)' }}>JPG: {jpgCount}</span>
          </div>
          <div className="kpi-label">Image Formats Breakdown</div>
        </div>
      </div>

      {/* ── DRAG & DROP UPLOAD CARD ── */}
      <div className="admin-card">
        <div className="card-header">
          <div className="card-header-left">
            <div className="card-title-icon">📤</div>
            <span className="card-title">Upload New Media</span>
          </div>
          <div className="card-header-right">
            <button
              className="btn btn-gold btn-sm"
              onClick={() => fileInputRef.current?.click()}
            >
              📁 Browse Computer
            </button>
          </div>
        </div>

        <div className="card-body" style={{ padding: '20px' }}>
          <input
            type="file"
            multiple
            accept="image/*"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={e => {
              if (e.target.files) uploadFiles(Array.from(e.target.files));
            }}
          />

          <div
            className={`media-dropzone ${isDragging ? 'drag-active' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="media-dropzone-icon">☁️</div>
            <div className="media-dropzone-title">Drag & Drop images here or click to browse</div>
            <div className="media-dropzone-sub">
              Upload high-resolution product photos, banners, and thumbnails. Automatic WebP optimization applied.
            </div>
            <div className="media-format-badges">
              <span className="media-format-badge">WEBP</span>
              <span className="media-format-badge">PNG</span>
              <span className="media-format-badge">JPG / JPEG</span>
              <span className="media-format-badge">GIF</span>
              <span className="media-format-badge">SVG</span>
              <span className="media-format-badge" style={{ color: 'var(--gold)' }}>Max 10MB per file</span>
            </div>
          </div>

          {uploadProgress && (
            <div className="media-upload-progress-box">
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--gold)' }}>
                <span>⏳ {uploadProgress}</span>
                <span>Optimizing & Saving...</span>
              </div>
              <div className="media-progress-bar-track">
                <div className="media-progress-bar-fill" style={{ width: '100%' }}></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── MEDIA LIBRARY EXPLORER CARD ── */}
      <div className="admin-card">
        <div className="card-header">
          <div className="card-header-left">
            <div className="card-title-icon">🖼️</div>
            <span className="card-title">Media Library</span>
            <span className="card-count">{filteredItems.length}</span>
          </div>

          <div className="card-header-right tbl-controls">
            {/* Search Box */}
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search by filename..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--muted)',
                    cursor: 'pointer'
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Format Filter Tabs */}
            <div className="status-tabs">
              <button
                className={`s-tab ${formatFilter === 'all' ? 'active' : ''}`}
                onClick={() => setFormatFilter('all')}
              >
                All
              </button>
              <button
                className={`s-tab ${formatFilter === 'webp' ? 'active' : ''}`}
                onClick={() => setFormatFilter('webp')}
              >
                WebP
              </button>
              <button
                className={`s-tab ${formatFilter === 'png' ? 'active' : ''}`}
                onClick={() => setFormatFilter('png')}
              >
                PNG
              </button>
              <button
                className={`s-tab ${formatFilter === 'jpeg' ? 'active' : ''}`}
                onClick={() => setFormatFilter('jpeg')}
              >
                JPG
              </button>
            </div>

            {/* Sort Filter */}
            <div className="status-tabs">
              <button
                className={`s-tab ${sortBy === 'newest' ? 'active' : ''}`}
                onClick={() => setSortBy('newest')}
                title="Newest Uploads First"
              >
                🕒 Newest
              </button>
              <button
                className={`s-tab ${sortBy === 'size-desc' ? 'active' : ''}`}
                onClick={() => setSortBy('size-desc')}
                title="Largest File Size First"
              >
                📦 Largest
              </button>
              <button
                className={`s-tab ${sortBy === 'name-asc' ? 'active' : ''}`}
                onClick={() => setSortBy('name-asc')}
                title="Alphabetical A-Z"
              >
                🔤 A-Z
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="view-switcher-pill">
              <button
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Grid View"
              >
                🔲 Grid
              </button>
              <button
                className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
                title="Table / List View"
              >
                📋 List
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Action Bar */}
        {selectedIds.size > 0 && (
          <div
            style={{
              padding: '10px 20px',
              background: 'rgba(212, 175, 55, 0.1)',
              borderBottom: '1px solid var(--gold-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px' }}>
              <span style={{ color: 'var(--gold)', fontWeight: 600 }}>
                {selectedIds.size} file(s) selected
              </span>
              <button
                className="btn btn-ghost btn-sm"
                onClick={toggleSelectAll}
              >
                {selectedIds.size === filteredItems.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => setBulkDeleteModalOpen(true)}
            >
              🗑️ Delete Selected ({selectedIds.size})
            </button>
          </div>
        )}

        <div className="card-body">
          {filteredItems.length === 0 ? (
            <div className="empty-state" style={{ padding: '60px 20px' }}>
              <div className="empty-icon">📁</div>
              <h3>No Media Files Found</h3>
              <p>
                {search || formatFilter !== 'all'
                  ? 'No images match your active filter criteria.'
                  : 'Start building your media library by uploading product images above.'}
              </p>
              {(search || formatFilter !== 'all') ? (
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ marginTop: '14px' }}
                  onClick={() => { setSearch(''); setFormatFilter('all'); }}
                >
                  Clear Filters
                </button>
              ) : (
                <button
                  className="btn btn-gold btn-sm"
                  style={{ marginTop: '14px' }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  ＋ Upload Image
                </button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            /* ── GRID VIEW ── */
            <div className="media-grid">
              {filteredItems.map(item => {
                const isSelected = selectedIds.has(item.id);
                const thumbUrl = getImageUrl(item.file_url || item.url, 'thumb');
                const fileType = (item.mime_type || '').split('/')[1]?.toUpperCase() || 'IMG';

                return (
                  <div
                    key={item.id}
                    className={`media-card-item ${isSelected ? 'selected' : ''}`}
                  >
                    <input
                      type="checkbox"
                      className="media-card-checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(item.id)}
                      onClick={e => e.stopPropagation()}
                    />

                    <div
                      className="media-card-thumb-wrap"
                      onClick={() => {
                        setSelectedMedia(item);
                        setDetailModalOpen(true);
                      }}
                    >
                      <img
                        src={thumbUrl}
                        alt={item.original_name || item.filename}
                        className="media-card-img"
                        loading="lazy"
                      />

                      <div className="media-card-overlay">
                        <button
                          className="media-overlay-btn"
                          title="Preview & Info"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMedia(item);
                            setDetailModalOpen(true);
                          }}
                        >
                          👁️
                        </button>
                        <button
                          className="media-overlay-btn"
                          title="Copy Image URL"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(item.file_url || item.url);
                          }}
                        >
                          📋
                        </button>
                        <button
                          className="media-overlay-btn danger"
                          title="Delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMedia(item);
                            setDeleteModalOpen(true);
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    <div className="media-card-meta">
                      <span className="media-card-name" title={item.original_name || item.filename}>
                        {item.original_name || item.filename}
                      </span>
                      <div className="media-card-info-row">
                        <span className="badge b-gold" style={{ padding: '1px 6px', fontSize: '9.5px' }}>{fileType}</span>
                        <span>{formatFileSize(item.file_size)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ── TABLE / LIST VIEW ── */
            <div className="tbl-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }} className="no-sort">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === filteredItems.length && filteredItems.length > 0}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th style={{ width: '70px' }}>Preview</th>
                    <th>File Name</th>
                    <th>Format</th>
                    <th>Size</th>
                    <th>Upload Date</th>
                    <th style={{ width: '120px' }} className="no-sort">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map(item => {
                    const isSelected = selectedIds.has(item.id);
                    const thumbUrl = getImageUrl(item.file_url || item.url, 'thumb');
                    const fileType = (item.mime_type || '').split('/')[1]?.toUpperCase() || 'IMG';

                    return (
                      <tr key={item.id} className={isSelected ? 'row-selected' : ''}>
                        <td>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(item.id)}
                          />
                        </td>
                        <td>
                          <div
                            style={{
                              width: '46px',
                              height: '46px',
                              borderRadius: '6px',
                              overflow: 'hidden',
                              background: 'rgba(0,0,0,0.3)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer'
                            }}
                            onClick={() => {
                              setSelectedMedia(item);
                              setDetailModalOpen(true);
                            }}
                          >
                            <img
                              src={thumbUrl}
                              alt={item.original_name}
                              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                            />
                          </div>
                        </td>
                        <td>
                          <div className="cell-name">{item.original_name || item.filename}</div>
                          <div className="cell-sub" style={{ fontSize: '11px' }}>{item.file_path || item.file_url}</div>
                        </td>
                        <td>
                          <span className="badge b-gold">{fileType}</span>
                        </td>
                        <td>
                          <span style={{ fontSize: '13px', color: 'var(--platinum)' }}>
                            {formatFileSize(item.file_size)}
                          </span>
                        </td>
                        <td>
                          <span className="badge b-info">
                            {formatDate(item.created_at || Date.now())}
                          </span>
                        </td>
                        <td>
                          <div className="row-actions">
                            <button
                              className="act-btn"
                              title="Preview Info"
                              onClick={() => {
                                setSelectedMedia(item);
                                setDetailModalOpen(true);
                              }}
                            >
                              👁️
                            </button>
                            <button
                              className="act-btn"
                              title="Copy URL"
                              onClick={() => copyToClipboard(item.file_url || item.url)}
                            >
                              📋
                            </button>
                            <button
                              className="act-btn act-delete"
                              title="Delete"
                              onClick={() => {
                                setSelectedMedia(item);
                                setDeleteModalOpen(true);
                              }}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card-footer">
          <div className="tbl-info">
            Showing <span>{filteredItems.length}</span> of <span>{items.length}</span> media files
          </div>
          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
            Total Storage: <strong style={{ color: 'var(--gold)' }}>{totalMB} MB</strong>
          </div>
        </div>
      </div>

      {/* ── DETAIL & PREVIEW MODAL ── */}
      {selectedMedia && (
        <Modal
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          title={`🖼️ Media Details — ${selectedMedia.original_name || selectedMedia.filename}`}
          size="lg"
          footer={
            <>
              <button
                className="btn btn-ghost"
                onClick={() => setDetailModalOpen(false)}
              >
                Close
              </button>
              <button
                className="btn btn-outline"
                onClick={() => copyToClipboard(selectedMedia.file_url || selectedMedia.url)}
              >
                📋 Copy Public URL
              </button>
              <a
                href={getImageUrl(selectedMedia.file_url || selectedMedia.url, 'original')}
                target="_blank"
                rel="noreferrer"
                className="btn btn-gold"
                download
              >
                ⬇️ Download Original
              </a>
              <button
                className="btn btn-danger"
                onClick={() => {
                  setDeleteModalOpen(true);
                }}
              >
                🗑️ Delete
              </button>
            </>
          }
        >
          <div className="media-detail-grid">
            <div className="media-detail-preview-box">
              <img
                src={getImageUrl(selectedMedia.file_url || selectedMedia.url, 'original')}
                alt={selectedMedia.original_name}
                style={{
                  maxHeight: '280px',
                  maxWidth: '100%',
                  objectFit: 'contain',
                  borderRadius: '6px'
                }}
              />
            </div>

            <div className="media-detail-info-list">
              <div className="media-detail-info-item">
                <span className="media-detail-label">Original Filename</span>
                <span className="media-detail-value">{selectedMedia.original_name || 'N/A'}</span>
              </div>

              <div className="media-detail-info-item">
                <span className="media-detail-label">Server Filename</span>
                <span className="media-detail-value" style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--gold)' }}>
                  {selectedMedia.filename || 'N/A'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="media-detail-info-item">
                  <span className="media-detail-label">File Size</span>
                  <span className="media-detail-value">{formatFileSize(selectedMedia.file_size)}</span>
                </div>
                <div className="media-detail-info-item">
                  <span className="media-detail-label">MIME Type</span>
                  <span className="media-detail-value">{selectedMedia.mime_type || 'image/jpeg'}</span>
                </div>
              </div>

              <div className="media-detail-info-item">
                <span className="media-detail-label">Upload Timestamp</span>
                <span className="media-detail-value">{formatDate(selectedMedia.created_at || Date.now())}</span>
              </div>

              <div className="media-detail-info-item">
                <span className="media-detail-label">Direct Public URL</span>
                <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                  <input
                    type="text"
                    readOnly
                    className="form-control"
                    style={{ fontSize: '12px', padding: '6px 10px' }}
                    value={getImageUrl(selectedMedia.file_url || selectedMedia.url, 'original')}
                  />
                  <button
                    className="btn btn-gold btn-sm"
                    onClick={() => copyToClipboard(selectedMedia.file_url || selectedMedia.url)}
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ── SINGLE DELETE CONFIRMATION MODAL ── */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="🗑️ Delete Media File"
        size="sm"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-danger" onClick={handleDelete}>
              🗑️ Delete Permanently
            </button>
          </>
        }
      >
        <div style={{ textAlign: 'center', padding: '24px 16px' }}>
          <div style={{ fontSize: '44px', marginBottom: '12px' }}>⚠️</div>
          <p style={{ color: 'var(--platinum)', fontSize: '15px', marginBottom: '6px' }}>
            Are you sure you want to permanently delete
          </p>
          <p style={{ color: 'var(--gold)', fontWeight: 600, fontSize: '14px', wordBreak: 'break-all' }}>
            "{selectedMedia?.original_name || selectedMedia?.filename}"?
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '12.5px', marginTop: '10px' }}>
            This file will be deleted from server storage. Any products using this media reference may lose their image.
          </p>
        </div>
      </Modal>

      {/* ── BULK DELETE CONFIRMATION MODAL ── */}
      <Modal
        isOpen={bulkDeleteModalOpen}
        onClose={() => !isDeleting && setBulkDeleteModalOpen(false)}
        title="🗑️ Bulk Delete Media Files"
        size="sm"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setBulkDeleteModalOpen(false)} disabled={isDeleting}>
              Cancel
            </button>
            <button className="btn btn-danger" onClick={handleBulkDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : `🗑️ Delete All ${selectedIds.size} Files`}
            </button>
          </>
        }
      >
        <div style={{ textAlign: 'center', padding: '24px 16px' }}>
          <div style={{ fontSize: '44px', marginBottom: '12px' }}>⚠️</div>
          <p style={{ color: 'var(--platinum)', fontSize: '15px', marginBottom: '6px' }}>
            Are you sure you want to permanently delete
          </p>
          <p style={{ color: 'var(--rose)', fontWeight: 700, fontSize: '16px' }}>
            {selectedIds.size} selected media files?
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '12.5px', marginTop: '10px' }}>
            {deleteProgress ? (
              <span style={{ color: 'var(--gold)' }}>⏳ {deleteProgress}</span>
            ) : (
              'This action cannot be undone.'
            )}
          </p>
        </div>
      </Modal>
    </>
  );
}
