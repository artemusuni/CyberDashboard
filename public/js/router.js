import { mountThreatMap, unmountThreatMap } from './pages/threatmap.js';
import { mountAnalytics, unmountAnalytics }   from './pages/analytics.js';
import { mountIpLookup, unmountIpLookup }     from './pages/iplookup.js';
import { mountSettings }                       from './pages/settings.js';

const PAGES = {
  dashboard: { mount: null,            unmount: null },
  threatmap: { mount: mountThreatMap,  unmount: unmountThreatMap },
  analytics: { mount: mountAnalytics,  unmount: unmountAnalytics },
  iplookup:  { mount: mountIpLookup,   unmount: unmountIpLookup },
  settings:  { mount: mountSettings,   unmount: null },
};

let currentPage = null;

function navigate(page) {
  if (!PAGES[page]) page = 'dashboard';
  if (page === currentPage) return;

  // Unmount current
  if (currentPage && PAGES[currentPage].unmount) {
    PAGES[currentPage].unmount();
  }

  // Hide all pages, show target
  document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
  document.getElementById(`page-${page}`).classList.add('active');

  // Update nav
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });

  // Mount new page
  if (PAGES[page].mount) {
    PAGES[page].mount(document.getElementById(`page-${page}`));
  }

  // Globe resize fix when returning to dashboard
  if (page === 'dashboard') {
    window.dispatchEvent(new Event('resize'));
  }

  currentPage = page;
  window.location.hash = page;
}

// Nav item clicks
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    window.Sounds?.click();
    navigate(item.dataset.page);
  });
});

// Sidebar toggle
const sidebar  = document.getElementById('sidebar');
const toggle   = document.getElementById('sidebarToggle');
toggle.addEventListener('click', () => {
  sidebar.classList.toggle('collapsed');
  window.dispatchEvent(new Event('resize'));
});

// Keyboard shortcuts: D/T/A/I/S navigate to pages
const KEY_MAP = { d: 'dashboard', t: 'threatmap', a: 'analytics', i: 'iplookup', s: 'settings' };
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.metaKey || e.ctrlKey || e.altKey) return;
  const page = KEY_MAP[e.key.toLowerCase()];
  if (page) { window.Sounds?.click(); navigate(page); }
});

// Hash-based routing on load
const hash = window.location.hash.replace('#', '') || 'dashboard';
navigate(hash);
