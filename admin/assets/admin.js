/* ============================================================
   Admin JS — Chhotu Fashion Admin Panel
   AdminTable class · Modals · Toasts · Sidebar · Dropdowns
   ============================================================ */

'use strict';

// Hide broken images
document.addEventListener('error', function(e) {
  if (e.target.tagName && e.target.tagName.toLowerCase() === 'img') {
    e.target.style.display = 'none';
  }
}, true);
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('img').forEach(function(img) {
    if (img.complete && typeof img.naturalWidth !== "undefined" && img.naturalWidth === 0) {
      img.style.display = 'none';
    }
  });
});

// ── Global table registry ──────────────────────────────────
const AdminTables = {};

// ============================================================
//  AdminTable CLASS
// ============================================================
class AdminTable {
  constructor(id, options = {}) {
    this.id          = id;
    this.data        = options.data        || [];
    this.searchFields= options.searchFields|| [];
    this.filterField = options.filterField || 'status';
    this.perPage     = options.perPage     || 10;
    this.renderRow   = options.renderRow   || (() => '<tr><td>No renderer</td></tr>');

    this.filteredData  = [...this.data];
    this.currentPage   = 1;
    this.sortField     = null;
    this.sortDir       = 'asc';
    this.activeFilter  = 'all';

    // DOM
    this.$body    = document.getElementById(id + '-body');
    this.$search  = document.getElementById(id + '-search');
    this.$info    = document.getElementById(id + '-info');
    this.$pages   = document.getElementById(id + '-pagination');
    this.$perPage = document.getElementById(id + '-perpage');

    AdminTables[id] = this;
    this._init();
  }

  _init() {
    // Search
    if (this.$search) {
      this.$search.addEventListener('input', () => { this.currentPage = 1; this._apply(); });
    }
    // Per-page
    if (this.$perPage) {
      this.$perPage.addEventListener('change', () => {
        this.perPage = parseInt(this.$perPage.value);
        this.currentPage = 1;
        this._render();
      });
    }
    // Sort headers
    document.querySelectorAll(`[data-tbl="${this.id}"][data-sort]`).forEach(th => {
      th.style.cursor = 'pointer';
      th.addEventListener('click', () => {
        const f = th.dataset.sort;
        if (this.sortField === f) this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
        else { this.sortField = f; this.sortDir = 'asc'; }
        document.querySelectorAll(`[data-tbl="${this.id}"][data-sort]`).forEach(h => h.classList.remove('sort-asc','sort-desc'));
        th.classList.add(this.sortDir === 'asc' ? 'sort-asc' : 'sort-desc');
        this._apply();
      });
    });
    // Filter tabs
    document.querySelectorAll(`[data-tbl="${this.id}"][data-filter]`).forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll(`[data-tbl="${this.id}"][data-filter]`).forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.activeFilter = tab.dataset.filter;
        this.currentPage  = 1;
        this._apply();
      });
    });
    this._apply();
  }

  _apply() {
    const q = this.$search ? this.$search.value.toLowerCase().trim() : '';

    this.filteredData = this.data.filter(row => {
      // Status tab filter
      if (this.activeFilter !== 'all') {
        const v = String(row[this.filterField] || '').toLowerCase().replace(/[\s/]+/g, '-');
        if (v !== this.activeFilter) return false;
      }
      // Search
      if (q) {
        return this.searchFields.some(f => String(row[f] || '').toLowerCase().includes(q));
      }
      return true;
    });

    // Sort
    if (this.sortField) {
      this.filteredData.sort((a, b) => {
        let va = a[this.sortField] ?? '', vb = b[this.sortField] ?? '';
        const na = parseFloat(String(va).replace(/[^\d.]/g, '')),
              nb = parseFloat(String(vb).replace(/[^\d.]/g, ''));
        if (!isNaN(na) && !isNaN(nb)) return this.sortDir === 'asc' ? na - nb : nb - na;
        return this.sortDir === 'asc'
          ? String(va).localeCompare(String(vb))
          : String(vb).localeCompare(String(va));
      });
    }
    this._render();
  }

  _render() {
    const total = this.filteredData.length;
    const start = (this.currentPage - 1) * this.perPage;
    const end   = Math.min(start + this.perPage, total);
    const slice = this.filteredData.slice(start, end);

    if (this.$body) {
      if (slice.length === 0) {
        this.$body.innerHTML = `<tr><td colspan="20">
          <div class="empty-state">
            <div class="empty-icon">🔍</div>
            <h3>No results found</h3>
            <p>Try adjusting your search or filter criteria</p>
          </div></td></tr>`;
      } else {
        this.$body.innerHTML = slice.map((row, i) => this.renderRow(row, start + i, this)).join('');
      }
    }

    this._info(total === 0 ? 0 : start + 1, end, total);
    this._pagination(total);
  }

  _info(s, e, t) {
    if (!this.$info) return;
    this.$info.innerHTML = t === 0
      ? 'No results found'
      : `Showing <span>${s}–${e}</span> of <span>${t}</span> results`;
  }

  _pagination(total) {
    if (!this.$pages) return;
    const tp = Math.ceil(total / this.perPage);
    if (tp <= 1) { this.$pages.innerHTML = ''; return; }

    let html = `<button class="page-btn" data-page="${this.currentPage - 1}" ${this.currentPage===1?'disabled':''}>&#8249;</button>`;

    let s = Math.max(1, this.currentPage - 2),
        e = Math.min(tp, s + 4);
    if (e - s < 4) s = Math.max(1, e - 4);

    if (s > 1) { html += `<button class="page-btn" data-page="1">1</button>`; if (s > 2) html += `<button class="page-btn" disabled>…</button>`; }
    for (let i = s; i <= e; i++) html += `<button class="page-btn${i===this.currentPage?' active':''}" data-page="${i}">${i}</button>`;
    if (e < tp) { if (e < tp - 1) html += `<button class="page-btn" disabled>…</button>`; html += `<button class="page-btn" data-page="${tp}">${tp}</button>`; }

    html += `<button class="page-btn" data-page="${this.currentPage + 1}" ${this.currentPage>=tp?'disabled':''}>&#8250;</button>`;
    this.$pages.innerHTML = html;

    this.$pages.querySelectorAll('.page-btn:not([disabled])').forEach(btn => {
      btn.addEventListener('click', () => this.goTo(parseInt(btn.dataset.page)));
    });
  }

  goTo(p) {
    const tp = Math.ceil(this.filteredData.length / this.perPage);
    if (p < 1 || p > tp) return;
    this.currentPage = p;
    this._render();
  }

  removeRow(id, field = 'id') {
    this.data = this.data.filter(r => r[field] !== id);
    this._apply();
  }

  updateRowStatus(id, newStatus, field = 'id') {
    const row = this.data.find(r => r[field] === id);
    if (row) row.status = newStatus;
    this._apply();
  }
}

// ============================================================
//  MODAL HELPERS
// ============================================================
function openModal(id) {
  const el = document.getElementById(id);
  if (el) { el.classList.add('open'); document.body.style.overflow = 'hidden'; }
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) { el.classList.remove('open'); document.body.style.overflow = ''; }
}
// Backdrop click
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) { e.target.classList.remove('open'); document.body.style.overflow = ''; }
});
// Escape key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') document.querySelectorAll('.modal-overlay.open').forEach(m => { m.classList.remove('open'); document.body.style.overflow = ''; });
});

// ============================================================
//  TOAST
// ============================================================
let _toastBox = null;
function showToast(msg, type = 'success') {
  if (!_toastBox) { _toastBox = document.createElement('div'); _toastBox.className = 'toast-container'; document.body.appendChild(_toastBox); }
  const icons = { success:'✅', error:'❌', warning:'⚠️', info:'ℹ️' };
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span class="toast-icon">${icons[type]||'ℹ️'}</span><span class="toast-msg">${msg}</span>`;
  _toastBox.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(100%)'; t.style.transition = '.3s'; setTimeout(() => t.remove(), 300); }, 3500);
}

// ============================================================
//  SIDEBAR TOGGLE
// ============================================================
function initSidebar() {
  const sidebar = document.getElementById('adminSidebar');
  const main    = document.getElementById('adminMain');
  const btn     = document.getElementById('sidebarToggle');
  if (!sidebar || !btn) return;

  let collapsed = localStorage.getItem('admin_sb') === '1';

  function apply() {
    if (window.innerWidth <= 768) {
      sidebar.classList.toggle('mob-open', !collapsed);
    } else {
      sidebar.classList.toggle('collapsed', collapsed);
      if (main) main.classList.toggle('expanded', collapsed);
    }
    localStorage.setItem('admin_sb', collapsed ? '1' : '0');
  }
  btn.addEventListener('click', () => { collapsed = !collapsed; apply(); });
  apply();

  // Close on resize
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) sidebar.classList.remove('mob-open');
  });
}

// ============================================================
//  DROPDOWNS
// ============================================================
function initDropdowns() {
  document.querySelectorAll('[data-dd]').forEach(trigger => {
    trigger.addEventListener('click', e => {
      e.stopPropagation();
      const id = trigger.dataset.dd;
      const menu = document.getElementById(id);
      if (!menu) return;
      const was = menu.classList.contains('open');
      document.querySelectorAll('.dropdown-menu.open').forEach(m => m.classList.remove('open'));
      if (!was) menu.classList.add('open');
    });
  });
  document.addEventListener('click', () => document.querySelectorAll('.dropdown-menu.open').forEach(m => m.classList.remove('open')));
}

// ============================================================
//  SETTINGS TABS
// ============================================================
function initSettingsTabs() {
  document.querySelectorAll('.stab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.stab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.stab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      const c = document.getElementById('tab-' + btn.dataset.tab);
      if (c) c.classList.add('active');
    });
  });
}

// ============================================================
//  STATUS BADGE HELPER
// ============================================================
function statusBadge(status) {
  const map = {
    'delivered':  ['b-success','✅'],
    'shipped':    ['b-info','🚚'],
    'processing': ['b-gold','⚙️'],
    'pending':    ['b-warning','🕐'],
    'cancelled':  ['b-danger','✖'],
    'active':     ['b-success','●'],
    'inactive':   ['b-muted','●'],
    'in stock':   ['b-success',''],
    'low stock':  ['b-warning',''],
    'out of stock':['b-danger',''],
    'draft':      ['b-muted',''],
  };
  const [cls, icon] = map[status.toLowerCase()] || ['b-muted',''];
  return `<span class="badge ${cls}">${icon ? icon+' ' : ''}${status}</span>`;
}

// ============================================================
//  INIT ON DOM READY
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  initDropdowns();
  initSettingsTabs();
  initThemeSwitcher();
  initCountUp();
  initGlobalSearch();
  initStagger();
});

// ============================================================
//  THEME SWITCHER
// ============================================================
function initThemeSwitcher() {
  const saved = localStorage.getItem('admin_theme') || 'gold';
  applyTheme(saved, false);
  document.querySelectorAll('.theme-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      const t = dot.dataset.t;
      applyTheme(t, true);
      localStorage.setItem('admin_theme', t);
    });
  });
}

function applyTheme(theme, animate) {
  document.documentElement.dataset.theme = theme === 'gold' ? '' : theme;
  document.querySelectorAll('.theme-dot').forEach(d => {
    d.classList.toggle('active', d.dataset.t === theme);
  });
  if (animate) showToast('🎨 Theme switched!', 'info');
}

// ============================================================
//  COUNT-UP ANIMATION
// ============================================================
function initCountUp() {
  document.querySelectorAll('.kpi-value[data-target]').forEach(el => {
    countUp(el, el.dataset.target, 1400);
  });
}

function countUp(el, raw, duration = 1200) {
  const isRupee = raw.includes('₹');
  const hasComma = raw.includes(',');
  const numStr = raw.replace(/[^\d]/g, '');
  const num = parseInt(numStr, 10);
  if (isNaN(num) || num === 0) return;

  const prefix = isRupee ? '₹' : '';
  let start = 0;
  const startTime = performance.now();

  function tick(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const ease = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(ease * num);
    el.textContent = prefix + current.toLocaleString('en-IN');
    if (progress < 1) requestAnimationFrame(tick);
    else el.textContent = prefix + num.toLocaleString('en-IN');
  }
  requestAnimationFrame(tick);
}

// ============================================================
//  STAGGER TABLE ROWS ON RENDER
// ============================================================
function initStagger() {
  // Observe table bodies and animate rows when content changes
  document.querySelectorAll('tbody[id]').forEach(tbody => {
    const obs = new MutationObserver(() => staggerRows(tbody));
    obs.observe(tbody, { childList: true });
    staggerRows(tbody); // initial
  });
}

function staggerRows(tbody) {
  const rows = tbody.querySelectorAll('tr');
  rows.forEach((row, i) => {
    row.classList.remove('row-anim');
    void row.offsetWidth; // force reflow
    row.style.animationDelay = (i * 35) + 'ms';
    row.classList.add('row-anim');
  });
}

// ============================================================
//  GLOBAL SEARCH (Ctrl+K)
// ============================================================
const GS_PAGES = [
  { ico:'📊', name:'Dashboard',  sub:'Stats, charts & recent orders',   href:'dashboard.php'  },
  { ico:'👗', name:'Products',   sub:'Manage & add products',           href:'products.php'   },
  { ico:'📦', name:'Orders',     sub:'View & update order status',      href:'orders.php'     },
  { ico:'👥', name:'Customers',  sub:'Customer directory & profiles',   href:'customers.php'  },
  { ico:'📈', name:'Analytics',  sub:'Revenue & sales charts',          href:'analytics.php'  },
  { ico:'📧', name:'Email Templates', sub:'Manage email content and variables', href:'email_templates.php' },
  { ico:'📬', name:'Email Logs', sub:'Track outgoing emails and status', href:'email_logs.php' },
  { ico:'⚙️', name:'Settings',   sub:'Store, payments, notifications',  href:'settings.php'   },
];

let gsActive = -1;

function initGlobalSearch() {
  const overlay = document.getElementById('gsOverlay');
  if (!overlay) return;

  const input   = document.getElementById('gsInput');
  const results = document.getElementById('gsResults');

  function render(q) {
    const lower = q.toLowerCase().trim();
    const list  = lower
      ? GS_PAGES.filter(p => p.name.toLowerCase().includes(lower) || p.sub.toLowerCase().includes(lower))
      : GS_PAGES;
    gsActive = -1;
    if (!list.length) {
      results.innerHTML = '<div class="gs-empty">🔍 No results found</div>';
      return;
    }
    results.innerHTML = `<div class="gs-sec-label">Pages</div>` + list.map((p, i) =>
      `<a href="${p.href}" class="gs-item" data-idx="${i}">
         <span class="gs-item-ico">${p.ico}</span>
         <div><div class="gs-item-name">${p.name}</div><div class="gs-item-sub">${p.sub}</div></div>
       </a>`
    ).join('');
  }

  input.addEventListener('input', () => render(input.value));

  // Keyboard arrow navigation
  overlay.addEventListener('keydown', e => {
    const items = results.querySelectorAll('.gs-item');
    if (e.key === 'ArrowDown') { gsActive = Math.min(gsActive + 1, items.length - 1); }
    else if (e.key === 'ArrowUp') { gsActive = Math.max(gsActive - 1, 0); }
    else if (e.key === 'Enter' && gsActive >= 0) { items[gsActive]?.click(); return; }
    items.forEach((el, i) => el.classList.toggle('active', i === gsActive));
    if (gsActive >= 0) items[gsActive]?.scrollIntoView({ block:'nearest' });
  });

  overlay.addEventListener('click', e => { if (e.target === overlay) closeGS(); });
  render('');
}

function openGS() {
  const ov = document.getElementById('gsOverlay');
  if (!ov) return;
  ov.classList.add('open');
  document.body.style.overflow = 'hidden';
  setTimeout(() => document.getElementById('gsInput')?.focus(), 40);
  document.getElementById('gsResults') && (document.getElementById('gsInput').value = '');
  // Re-render
  const input = document.getElementById('gsInput');
  if (input) input.dispatchEvent(new Event('input'));
}

function closeGS() {
  const ov = document.getElementById('gsOverlay');
  if (ov) { ov.classList.remove('open'); document.body.style.overflow = ''; }
}

// Ctrl+K / Cmd+K global listener
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); openGS(); }
  if (e.key === 'Escape') closeGS();
});

// ============================================================
//  SEARCHABLE SELECT — reusable custom dropdown with search
// ============================================================
class SearchableSelect {
  /**
   * @param {HTMLSelectElement} selectEl  The native <select> to enhance
   * @param {object} opts
   *   opts.placeholder  {string}  Search input placeholder
   *   opts.noResults    {string}  Text shown when search has no matches
   */
  constructor(selectEl, opts = {}) {
    if (!selectEl || selectEl.dataset.ssInit) return;
    selectEl.dataset.ssInit = '1';

    this.select      = selectEl;
    this.opts        = Object.assign({ placeholder: 'Search…', noResults: 'No results found' }, opts);
    this._open       = false;
    this._activeIdx  = -1;

    this._build();
    this._bindEvents();
  }

  /** Build the custom wrapper DOM */
  _build() {
    const sel = this.select;

    // Wrapper
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'ss-wrapper';
    if (sel.className) this.wrapper.dataset.origClass = sel.className;

    // Trigger button
    this.trigger = document.createElement('button');
    this.trigger.type = 'button';
    this.trigger.className = 'ss-trigger';
    this.trigger.setAttribute('aria-haspopup', 'listbox');
    this.trigger.setAttribute('aria-expanded', 'false');

    this.triggerText = document.createElement('span');
    this.triggerText.className = 'ss-trigger-text';
    this.triggerText.textContent = this._getSelectedLabel();

    this.triggerArrow = document.createElement('span');
    this.triggerArrow.className = 'ss-arrow';
    this.triggerArrow.innerHTML = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4L6 8L10 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    this.trigger.appendChild(this.triggerText);
    this.trigger.appendChild(this.triggerArrow);

    // Dropdown panel
    this.panel = document.createElement('div');
    this.panel.className = 'ss-panel';
    this.panel.setAttribute('role', 'listbox');

    // Search input row
    const searchRow = document.createElement('div');
    searchRow.className = 'ss-search-row';

    this.searchIcon = document.createElement('span');
    this.searchIcon.className = 'ss-search-icon';
    this.searchIcon.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>';

    this.searchInput = document.createElement('input');
    this.searchInput.type = 'text';
    this.searchInput.className = 'ss-search-input';
    this.searchInput.placeholder = this.opts.placeholder;
    this.searchInput.setAttribute('autocomplete', 'off');
    this.searchInput.setAttribute('aria-label', 'Search options');

    searchRow.appendChild(this.searchIcon);
    searchRow.appendChild(this.searchInput);
    this.panel.appendChild(searchRow);

    // Options list
    this.list = document.createElement('ul');
    this.list.className = 'ss-list';
    this.list.setAttribute('role', 'listbox');
    this.panel.appendChild(this.list);

    // No-results msg
    this.noResultsEl = document.createElement('div');
    this.noResultsEl.className = 'ss-no-results';
    this.noResultsEl.textContent = this.opts.noResults;
    this.panel.appendChild(this.noResultsEl);

    // Assemble
    this.wrapper.appendChild(this.trigger);
    this.wrapper.appendChild(this.panel);

    // Copy width-related classes from original select
    if (sel.classList.contains('filter-sel'))  this.wrapper.classList.add('ss-filter');
    if (sel.classList.contains('per-page-sel')) this.wrapper.classList.add('ss-perpage');
    if (sel.classList.contains('form-control')) this.wrapper.classList.add('ss-form');
    if (sel.classList.contains('sort-select'))  this.wrapper.classList.add('ss-sort');

    // Copy id for label association
    if (sel.id) {
      this.wrapper.id = sel.id + '-ss';
      this.trigger.id = sel.id + '-ss-trigger';
    }

    // Insert wrapper before select, then move select inside (hidden)
    sel.parentNode.insertBefore(this.wrapper, sel);
    sel.style.display = 'none';
    this.wrapper.appendChild(sel);

    this._renderOptions('');
  }

  /** Render option items filtered by query */
  _renderOptions(query) {
    const q = query.trim().toLowerCase();
    const options = Array.from(this.select.options);
    this.list.innerHTML = '';
    this._activeIdx = -1;

    const filtered = options.filter(o => o.text.toLowerCase().includes(q));

    filtered.forEach((opt, i) => {
      const li = document.createElement('li');
      li.className = 'ss-option';
      li.setAttribute('role', 'option');
      li.dataset.value = opt.value;
      li.dataset.idx   = i;

      if (opt.value === this.select.value || (opt.value === '' && !opt.value && i === 0 && !this.select.value)) {
        li.classList.add('selected');
      }
      if (opt.selected) li.classList.add('selected');

      // Highlight match
      if (q) {
        const text = opt.text;
        const start = text.toLowerCase().indexOf(q);
        li.innerHTML = start >= 0
          ? `${this._esc(text.slice(0, start))}<mark>${this._esc(text.slice(start, start + q.length))}</mark>${this._esc(text.slice(start + q.length))}`
          : this._esc(text);
      } else {
        li.textContent = opt.text;
      }

      li.addEventListener('mousedown', e => { e.preventDefault(); this._select(opt.value, opt.text); });
      li.addEventListener('mousemove', () => { this._setActive(i); });
      this.list.appendChild(li);
    });

    const hasResults = filtered.length > 0;
    this.noResultsEl.style.display = hasResults ? 'none' : 'block';
    this.list.style.display = hasResults ? 'block' : 'none';
  }

  /** Select a value */
  _select(value, label) {
    this.select.value = value;
    // Fallback for selects where value == text
    if (this.select.value !== value) {
      Array.from(this.select.options).forEach(o => { o.selected = (o.text === label); });
    }
    this.triggerText.textContent = label;
    this.select.dispatchEvent(new Event('change', { bubbles: true }));
    this.close();
  }

  /** Open the dropdown */
  open() {
    if (this._open) return;
    this._open = true;
    this.panel.classList.add('ss-open');
    this.trigger.setAttribute('aria-expanded', 'true');
    this.trigger.classList.add('ss-active');
    this.searchInput.value = '';
    this._renderOptions('');
    setTimeout(() => this.searchInput.focus(), 30);
  }

  /** Close the dropdown */
  close() {
    if (!this._open) return;
    this._open = false;
    this.panel.classList.remove('ss-open');
    this.trigger.setAttribute('aria-expanded', 'false');
    this.trigger.classList.remove('ss-active');
    this._activeIdx = -1;
  }

  /** Update active keyboard item */
  _setActive(idx) {
    const items = this.list.querySelectorAll('.ss-option');
    items.forEach((el, i) => el.classList.toggle('ss-kb-active', i === idx));
    this._activeIdx = idx;
  }

  /** Get currently selected label */
  _getSelectedLabel() {
    const sel = this.select;
    return sel.options[sel.selectedIndex]?.text || sel.options[0]?.text || '';
  }

  /** HTML-escape helper */
  _esc(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  /** Refresh trigger label (call externally if select value changes) */
  refresh() {
    this.triggerText.textContent = this._getSelectedLabel();
    this._renderOptions(this.searchInput.value || '');
  }

  _bindEvents() {
    // Toggle on trigger click
    this.trigger.addEventListener('click', e => {
      e.stopPropagation();
      this._open ? this.close() : this.open();
    });

    // Search input
    this.searchInput.addEventListener('input', () => {
      this._renderOptions(this.searchInput.value);
    });

    // Keyboard navigation
    this.searchInput.addEventListener('keydown', e => {
      const items = this.list.querySelectorAll('.ss-option');
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        this._setActive(Math.min(this._activeIdx + 1, items.length - 1));
        items[this._activeIdx]?.scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this._setActive(Math.max(this._activeIdx - 1, 0));
        items[this._activeIdx]?.scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (this._activeIdx >= 0) items[this._activeIdx]?.dispatchEvent(new MouseEvent('mousedown'));
      } else if (e.key === 'Escape') {
        this.close();
        this.trigger.focus();
      }
    });

    // Close on outside click
    document.addEventListener('click', e => {
      if (!this.wrapper.contains(e.target)) this.close();
    });

    // Close all other dropdowns when this one opens
    this.trigger.addEventListener('click', () => {
      if (this._open) {
        document.querySelectorAll('.ss-panel.ss-open').forEach(p => {
          if (p !== this.panel) p.classList.remove('ss-open');
        });
      }
    });
  }

  /** Static factory — enhance a select by its ID */
  static enhance(id, opts) {
    const el = document.getElementById(id);
    if (el) return new SearchableSelect(el, opts);
  }

  /** Static — auto-init all selects with data-searchable or by selector */
  static initAll(selector = 'select', opts = {}) {
    document.querySelectorAll(selector).forEach(sel => {
      // Skip selects with only 1 option (pointless to search)
      if (sel.options.length < 2) return;
      new SearchableSelect(sel, opts);
    });
  }
}

// ── Auto-init all <select> elements in the admin panel ──
document.addEventListener('DOMContentLoaded', () => {
  SearchableSelect.initAll('select');
});

/**
 * ssSetValue — programmatically set a SearchableSelect's value and refresh its UI.
 * Use this instead of `document.getElementById(id).value = val` when the select
 * has been enhanced by SearchableSelect, so the trigger label stays in sync.
 *
 * @param {string} id    The ID of the original <select> element
 * @param {string} value The new value to select
 */
function ssSetValue(id, value) {
  const sel = document.getElementById(id);
  if (!sel) return;
  sel.value = value;
  // Find the SearchableSelect instance wrapper sibling and refresh its label
  const wrapper = sel.closest('.ss-wrapper');
  if (wrapper) {
    const triggerText = wrapper.querySelector('.ss-trigger-text');
    const chosen = Array.from(sel.options).find(o => o.value === value || o.text === value);
    if (triggerText && chosen) {
      triggerText.textContent = chosen.text;
    }
  }
}

/* ============================================================
   AdminExport — Universal Export Engine (CSV, Excel, PDF)
   ============================================================ */
const AdminExport = {
  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  },

  toCSV(data, filenamePrefix, columns) {
    if (!data || !data.length) {
      if (typeof showToast === 'function') showToast('⚠️ No records to export.', 'warning');
      return;
    }
    const headers = columns.map(c => `"${(c.label || '').replace(/"/g, '""')}"`).join(',');
    const rows = data.map(row => {
      return columns.map(c => {
        let val = typeof c.key === 'function' ? c.key(row) : row[c.key];
        if (val === null || val === undefined) val = '';
        val = String(val).replace(/"/g, '""');
        return `"${val}"`;
      }).join(',');
    });
    const csvContent = '\uFEFF' + [headers, ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const filename = `${filenamePrefix}_${new Date().toISOString().slice(0, 10)}.csv`;
    this.downloadBlob(blob, filename);
    if (typeof showToast === 'function') showToast(`✅ Exported ${data.length} records to CSV`, 'success');
  },

  toExcel(data, filenamePrefix, columns, title) {
    if (!data || !data.length) {
      if (typeof showToast === 'function') showToast('⚠️ No records to export.', 'warning');
      return;
    }
    const headersHtml = columns.map(c => `<th style="background-color:#141b2d;color:#d4af37;padding:10px;border:1px solid #2d3748;font-weight:bold;">${c.label}</th>`).join('');
    const rowsHtml = data.map((row, idx) => {
      const bg = idx % 2 === 0 ? '#ffffff' : '#f8f9fa';
      const cells = columns.map(c => {
        let val = typeof c.key === 'function' ? c.key(row) : row[c.key];
        if (val === null || val === undefined) val = '';
        return `<td style="padding:8px 10px;border:1px solid #e2e8f0;color:#1a202c;">${val}</td>`;
      }).join('');
      return `<tr style="background-color:${bg};">${cells}</tr>`;
    }).join('');

    const template = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Export</x:Name>
                <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
      </head>
      <body>
        <h2 style="color:#141b2d;font-family:Arial,sans-serif;margin-bottom:12px;">${title || filenamePrefix}</h2>
        <p style="color:#718096;font-size:12px;font-family:Arial,sans-serif;">Generated on: ${new Date().toLocaleString()} | Total Records: ${data.length}</p>
        <table border="1" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:13px;width:100%;">
          <thead><tr>${headersHtml}</tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([template], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const filename = `${filenamePrefix}_${new Date().toISOString().slice(0, 10)}.xls`;
    this.downloadBlob(blob, filename);
    if (typeof showToast === 'function') showToast(`✅ Exported ${data.length} records to Excel`, 'success');
  },

  toPDF(data, filenamePrefix, columns, title) {
    if (!data || !data.length) {
      if (typeof showToast === 'function') showToast('⚠️ No records to export.', 'warning');
      return;
    }
    const headersHtml = columns.map(c => `<th>${c.label}</th>`).join('');
    const rowsHtml = data.map((row, idx) => {
      const cells = columns.map(c => {
        let val = typeof c.key === 'function' ? c.key(row) : row[c.key];
        if (val === null || val === undefined) val = '';
        return `<td>${val}</td>`;
      }).join('');
      return `<tr>${cells}</tr>`;
    }).join('');

    const printWin = window.open('', '_blank', 'width=900,height=700');
    if (!printWin) {
      if (typeof showToast === 'function') showToast('⚠️ Pop-up blocked. Please allow pop-ups for PDF export.', 'warning');
      return;
    }

    printWin.document.write(\`
      <!DOCTYPE html>
      <html>
      <head>
        <title>\${title || filenamePrefix}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 24px; color: #1e293b; }
          .header { border-bottom: 2px solid #d4af37; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
          .title { font-size: 20px; font-weight: bold; color: #0b1329; margin: 0; }
          .meta { font-size: 12px; color: #64748b; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
          th { background: #0b1329; color: #d4af37; text-align: left; padding: 8px 10px; font-weight: 600; }
          td { padding: 7px 10px; border-bottom: 1px solid #e2e8f0; }
          tr:nth-child(even) { background: #f8fafc; }
          @media print {
            body { padding: 0; }
            button { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">👑 Chhotu Fashion · \${title || filenamePrefix}</div>
            <div class="meta">Exported on: \${new Date().toLocaleString()} | Total Records: \${data.length}</div>
          </div>
        </div>
        <table>
          <thead><tr>${headersHtml}</tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </body>
      </html>
    `);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => {
      printWin.print();
    }, 400);
    if (typeof showToast === 'function') showToast(`📄 Preparing PDF for ${data.length} records…`, 'info');
  },

  showMenu(btn, onSelect) {
    const existing = document.getElementById('global-export-menu');
    if (existing) {
      existing.remove();
      return;
    }

    const rect = btn.getBoundingClientRect();
    const menu = document.createElement('div');
    menu.id = 'global-export-menu';
    menu.style.cssText = `
      position: fixed;
      top: ${rect.bottom + 8}px;
      left: ${Math.max(10, rect.right - 250)}px;
      background: #141c2e;
      background-image: linear-gradient(180deg, #182238 0%, #111726 100%);
      border: 1px solid rgba(212, 175, 55, 0.45);
      border-radius: 10px;
      box-shadow: 0 16px 42px rgba(0, 0, 0, 0.88), 0 0 20px rgba(212, 175, 55, 0.15);
      padding: 6px;
      width: 250px;
      min-width: 250px;
      z-index: 999999;
      display: flex;
      flex-direction: column;
      gap: 3px;
      animation: dropdownFadeIn 0.15s ease-out;
    `;

    const titleHeader = document.createElement('div');
    titleHeader.innerHTML = '<span>✨</span><span>Download Format</span>';
    titleHeader.style.cssText = `
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #d4af37;
      padding: 8px 10px 6px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 6px;
    `;
    menu.appendChild(titleHeader);

    const options = [
      { icon: '📊', name: 'Excel Spreadsheet', badge: '.XLSX', color: '#34d399', bg: 'rgba(16, 185, 129, 0.25)', border: 'rgba(16, 185, 129, 0.4)', hoverBg: 'rgba(16, 185, 129, 0.18)', type: 'excel' },
      { icon: '📄', name: 'CSV Document', badge: '.CSV', color: '#60a5fa', bg: 'rgba(59, 130, 246, 0.25)', border: 'rgba(59, 130, 246, 0.4)', hoverBg: 'rgba(59, 130, 246, 0.18)', type: 'csv' },
      { icon: '📕', name: 'PDF Document', badge: '.PDF', color: '#f87171', bg: 'rgba(239, 68, 68, 0.25)', border: 'rgba(239, 68, 68, 0.4)', hoverBg: 'rgba(239, 68, 68, 0.18)', type: 'pdf' }
    ];

    options.forEach(opt => {
      const item = document.createElement('button');
      item.type = 'button';
      item.innerHTML = `
        <span style="display:flex; align-items:center; gap:8px; white-space:nowrap;">
          <span style="font-size:15px;">${opt.icon}</span>
          <span style="font-weight:600;">${opt.name}</span>
        </span>
        <span style="font-size:11px; padding:2px 7px; border-radius:4px; background:${opt.bg}; border:1px solid ${opt.border}; color:${opt.color}; font-weight:700; flex-shrink:0;">
          ${opt.badge}
        </span>
      `;
      item.style.cssText = `
        background: transparent;
        border: none;
        color: #f1f5f9;
        padding: 9px 12px;
        text-align: left;
        font-size: 13px;
        border-radius: 6px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: space-between;
        transition: all 0.15s ease;
        white-space: nowrap;
        width: 100%;
      `;
      item.onmouseenter = () => { item.style.background = opt.hoverBg; item.style.color = opt.color; };
      item.onmouseleave = () => { item.style.background = 'transparent'; item.style.color = '#f1f5f9'; };
      item.onclick = (e) => {
        e.stopPropagation();
        menu.remove();
        onSelect(opt.type);
      };
      menu.appendChild(item);
    });

    const closeHandler = (e) => {
      if (!menu.contains(e.target) && e.target !== btn) {
        menu.remove();
        document.removeEventListener('click', closeHandler);
      }
    };

    document.body.appendChild(menu);
    setTimeout(() => {
      document.addEventListener('click', closeHandler);
    }, 10);
  }
};
