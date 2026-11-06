<?php
require_once 'includes/auth.php';
require_once 'includes/db.php';
$pageTitle  = 'Media Library';
$activePage = 'media';
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🖼️</text></svg>">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Media Library — Chhotu Fashion Admin</title>
  <link rel="stylesheet" href="assets/admin.css?v=<?= filemtime('assets/admin.css') ?>">
</head>
<body>
<div class="admin-wrapper">
  <?php include 'includes/sidebar.php'; ?>
  <div class="admin-main" id="adminMain">
    <?php include 'includes/topbar.php'; ?>
    <main class="admin-content">

      <!-- Upload Drag & Drop Area -->
      <div class="admin-card" style="margin-bottom: 24px;">
        <div class="card-header">
          <div class="card-header-left">
            <div class="card-title-icon">📤</div>
            <span class="card-title">Upload New Media</span>
          </div>
        </div>
        <div class="card-body">
          <div class="media-upload-zone" id="dropZone" onclick="document.getElementById('fileInput').click()">
            <input type="file" id="fileInput" multiple accept="image/jpeg,image/jpg,image/png,image/webp,image/gif" style="display:none" onchange="uploadFiles(this.files)">
            <div class="upload-icon">☁️</div>
            <div class="upload-title">Drag &amp; Drop images here or <span class="upload-browse">Browse Files</span></div>
            <div class="upload-subtitle">Supports JPG, PNG, WEBP, GIF up to 5MB</div>
          </div>
          <div id="uploadProgressContainer" class="upload-progress-container" style="display:none; margin-top:16px;">
            <div class="upload-progress-bar" id="uploadProgressBar"></div>
            <div class="upload-progress-text" id="uploadProgressText">Uploading...</div>
          </div>
        </div>
      </div>

      <!-- Media Library Grid Card -->
      <div class="admin-card">
        <div class="card-header">
          <div class="card-header-left">
            <div class="card-title-icon">🖼️</div>
            <span class="card-title">Media Library</span>
            <span class="card-count" id="media-count">0</span>
          </div>
          <div class="card-header-right tbl-controls">
            <div class="search-box">
              <span class="search-icon">🔍</span>
              <input type="text" id="media-search" placeholder="Search filenames..." oninput="filterMedia()">
            </div>
            <div class="media-stats-bar" id="mediaStats">
              <span class="stat-item" id="totalSizeStat">Total: 0 MB</span>
            </div>
          </div>
        </div>

        <div class="card-body">
          <div id="mediaGrid" class="media-grid">
            <div class="media-empty-state">
              <div class="empty-icon">🖼️</div>
              <p>Loading media library...</p>
            </div>
          </div>
        </div>
      </div>

    </main>
  </div>
</div>

<!-- Image Details Modal -->
<div class="modal-overlay" id="mediaDetailModal">
  <div class="modal-container modal-md">
    <div class="modal-header">
      <div class="modal-title">🖼️ Media Details</div>
      <button class="modal-close" onclick="closeModal('mediaDetailModal')">✕</button>
    </div>
    <div class="modal-body" id="mediaDetailBody">
      <!-- Injected via JS -->
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal('mediaDetailModal')">Close</button>
      <button class="btn btn-gold" id="btnCopyDetailUrl">📋 Copy File URL</button>
      <button class="btn btn-danger" id="btnDeleteDetailMedia">🗑️ Delete Image</button>
    </div>
  </div>
</div>

<!-- Delete Confirmation Modal -->
<div class="modal-overlay" id="deleteMediaModal">
  <div class="modal-container modal-sm">
    <div class="modal-header">
      <div class="modal-title">🗑️ Delete Media</div>
      <button class="modal-close" onclick="closeModal('deleteMediaModal')">✕</button>
    </div>
    <div class="modal-body" style="text-align:center;padding:24px 20px">
      <div style="font-size:44px;margin-bottom:12px">⚠️</div>
      <p style="color:var(--platinum);font-size:15px;margin-bottom:6px">Are you sure you want to delete this media item?</p>
      <p style="color:var(--gold);font-weight:600;font-size:14px;word-break:break-all" id="delMediaName"></p>
      <div id="delUsageWarning" style="display:none; margin-top:12px; padding:10px; background:rgba(239,68,68,0.15); border:1px solid var(--ruby); border-radius:8px; color:#fca5a5; font-size:13px; text-align:left;"></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal('deleteMediaModal')">Cancel</button>
      <button class="btn btn-danger" id="btnConfirmDeleteMedia">🗑 Delete</button>
    </div>
  </div>
</div>

<script src="assets/admin.js?v=<?= filemtime('assets/admin.js') ?>"></script>
<script>
let allMedia = [];
let mediaToDelete = null;

document.addEventListener('DOMContentLoaded', () => {
  loadMedia();
  setupDragAndDrop();
});

// Load Media Items
function loadMedia() {
  fetch('media_api.php?action=list')
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        allMedia = data.data;
        renderMediaGrid(allMedia);
      }
    })
    .catch(err => console.error(err));
}

// Render Media Grid
function renderMediaGrid(items) {
  const grid = document.getElementById('mediaGrid');
  const countEl = document.getElementById('media-count');
  const totalSizeEl = document.getElementById('totalSizeStat');

  countEl.textContent = items.length;

  let totalBytes = items.reduce((acc, item) => acc + parseInt(item.file_size || 0), 0);
  let totalMB = (totalBytes / (1024 * 1024)).toFixed(2);
  totalSizeEl.textContent = `Total: ${totalMB} MB`;

  if (items.length === 0) {
    grid.innerHTML = `
      <div class="media-empty-state">
        <div class="empty-icon">📁</div>
        <p>No media files found in library.</p>
        <button class="btn btn-gold" onclick="document.getElementById('fileInput').click()" style="margin-top:12px">Upload First Image</button>
      </div>`;
    return;
  }

  grid.innerHTML = items.map(item => {
    const formattedSize = (item.file_size / 1024).toFixed(1) + ' KB';
    const isInUse = parseInt(item.usage_count || 0) > 0;
    return `
      <div class="media-card" onclick="openMediaDetails(${item.id})">
        <div class="media-card-img-wrap">
          <img src="${item.file_url}" alt="${escapeHtml(item.original_name)}" loading="lazy">
          ${isInUse ? `<span class="badge b-success in-use-badge" title="Used in products">In Use (${item.usage_count})</span>` : ''}
        </div>
        <div class="media-card-info">
          <div class="media-card-name" title="${escapeHtml(item.original_name)}">${escapeHtml(item.original_name)}</div>
          <div class="media-card-meta">${item.width && item.height ? item.width + 'x' + item.height + ' • ' : ''}${formattedSize}</div>
        </div>
        <div class="media-card-actions" onclick="event.stopPropagation()">
          <button class="act-btn act-view" title="Copy URL" onclick="copyUrl('${item.file_url}')">📋</button>
          <button class="act-btn act-delete" title="Delete" onclick="confirmDeleteMedia(${item.id})">🗑️</button>
        </div>
      </div>
    `;
  }).join('');
}

// Filter Media
function filterMedia() {
  const query = document.getElementById('media-search').value.toLowerCase().trim();
  const filtered = allMedia.filter(m => 
    m.original_name.toLowerCase().includes(query) || 
    m.filename.toLowerCase().includes(query)
  );
  renderMediaGrid(filtered);
}

// Drag and drop setup
function setupDragAndDrop() {
  const dropZone = document.getElementById('dropZone');
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => dropZone.classList.add('drag-active'), false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => dropZone.classList.remove('drag-active'), false);
  });

  dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    uploadFiles(files);
  });
}

// Upload Handler
function uploadFiles(files) {
  if (!files || files.length === 0) return;

  const formData = new FormData();
  for (let i = 0; i < files.length; i++) {
    formData.append('files[]', files[i]);
  }

  const progressContainer = document.getElementById('uploadProgressContainer');
  const progressBar = document.getElementById('uploadProgressBar');
  const progressText = document.getElementById('uploadProgressText');

  progressContainer.style.display = 'block';
  progressBar.style.width = '0%';
  progressText.textContent = `Uploading ${files.length} file(s)...`;

  const xhr = new XMLHttpRequest();
  xhr.open('POST', 'media_upload.php', true);

  xhr.upload.onprogress = (e) => {
    if (e.lengthComputable) {
      const percent = Math.round((e.loaded / e.total) * 100);
      progressBar.style.width = percent + '%';
      progressText.textContent = `Uploading... ${percent}%`;
    }
  };

  xhr.onload = () => {
    progressContainer.style.display = 'none';
    if (xhr.status === 200) {
      try {
        const res = JSON.parse(xhr.responseText);
        if (res.success) {
          showToast(`✅ Uploaded ${res.files.length} file(s) successfully!`, 'success');
          loadMedia();
        } else {
          showToast(`⚠️ Upload error: ${res.errors ? res.errors.join(', ') : res.message}`, 'danger');
        }
      } catch (err) {
        showToast('⚠️ Error parsing server response', 'danger');
      }
    } else {
      showToast('⚠️ Server error during upload', 'danger');
    }
    document.getElementById('fileInput').value = '';
  };

  xhr.onerror = () => {
    progressContainer.style.display = 'none';
    showToast('⚠️ Network error during upload', 'danger');
  };

  xhr.send(formData);
}

// Open Media Details
function openMediaDetails(id) {
  const item = allMedia.find(m => m.id === id);
  if (!item) return;

  const formattedSize = (item.file_size / 1024).toFixed(1) + ' KB';
  const detailBody = document.getElementById('mediaDetailBody');

  detailBody.innerHTML = `
    <div style="text-align:center; margin-bottom:18px; background:rgba(0,0,0,0.3); padding:16px; border-radius:12px;">
      <img src="${item.file_url}" alt="${escapeHtml(item.original_name)}" style="max-height:260px; max-width:100%; object-fit:contain; border-radius:8px;">
    </div>
    <div class="form-grid" style="margin-bottom:0">
      <div class="od-block full"><div class="od-label">Original Name</div><div class="od-val" style="word-break:break-all">${escapeHtml(item.original_name)}</div></div>
      <div class="od-block"><div class="od-label">File Size</div><div class="od-val">${formattedSize}</div></div>
      <div class="od-block"><div class="od-label">Dimensions</div><div class="od-val">${item.width && item.height ? item.width + ' × ' + item.height + ' px' : 'N/A'}</div></div>
      <div class="od-block"><div class="od-label">MIME Type</div><div class="od-val">${item.mime_type}</div></div>
      <div class="od-block"><div class="od-label">Upload Date</div><div class="od-val">${item.created_at}</div></div>
      <div class="od-block full"><div class="od-label">File URL</div><div class="od-val" style="font-size:12px; word-break:break-all; font-family:monospace; background:var(--bg-card); padding:6px 10px; border-radius:6px;">${item.file_url}</div></div>
    </div>
  `;

  document.getElementById('btnCopyDetailUrl').onclick = () => copyUrl(item.file_url);
  document.getElementById('btnDeleteDetailMedia').onclick = () => {
    closeModal('mediaDetailModal');
    confirmDeleteMedia(item.id);
  };

  openModal('mediaDetailModal');
}

// Confirm Delete Media
function confirmDeleteMedia(id) {
  const item = allMedia.find(m => m.id === id);
  if (!item) return;

  mediaToDelete = item;
  document.getElementById('delMediaName').textContent = item.original_name;

  const warningEl = document.getElementById('delUsageWarning');
  warningEl.style.display = 'none';
  warningEl.innerHTML = '';

  // Check if used
  fetch(`media_api.php?action=usage&id=${id}`)
    .then(res => res.json())
    .then(res => {
      if (res.success && res.usage && res.usage.length > 0) {
        let prodNames = res.usage.map(p => p.name).join(', ');
        warningEl.innerHTML = `⚠️ <b>Warning:</b> This image is used in ${res.usage.length} product(s):<br><em>${escapeHtml(prodNames)}</em>`;
        warningEl.style.display = 'block';
      }
    });

  document.getElementById('btnConfirmDeleteMedia').onclick = executeDeleteMedia;
  openModal('deleteMediaModal');
}

function executeDeleteMedia() {
  if (!mediaToDelete) return;

  fetch(`media_api.php?action=delete&id=${mediaToDelete.id}&force=1`, { method: 'POST' })
    .then(res => res.json())
    .then(res => {
      closeModal('deleteMediaModal');
      if (res.success) {
        showToast('🗑️ Media deleted successfully', 'warning');
        loadMedia();
      } else {
        showToast(`⚠️ ${res.message}`, 'danger');
      }
    })
    .catch(() => showToast('⚠️ Error deleting media', 'danger'));
}

// Helper: Copy URL
function copyUrl(url) {
  const fullUrl = window.location.origin + '/' + url.replace('../', '');
  navigator.clipboard.writeText(fullUrl).then(() => {
    showToast('📋 Image URL copied to clipboard!', 'info');
  }).catch(() => {
    showToast('📋 Copied: ' + url, 'info');
  });
}

function escapeHtml(text) {
  if (!text) return '';
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
</script>
</body>
</html>
