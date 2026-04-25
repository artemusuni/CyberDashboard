// ── Clock ──
function updateClock() {
  const now = new Date();
  document.getElementById('clock').textContent =
    now.toUTCString().replace('GMT', 'UTC');
}
updateClock();
setInterval(updateClock, 1000);

// ── Live News Feed + CVE Feed ──
const feed    = document.getElementById('newsFeed');
const cveFeed = document.getElementById('cveFeed');
const tabNews = document.getElementById('tabNews');
const tabCve  = document.getElementById('tabCve');

let cveLoaded = false;

function renderNews(items) {
  const prev = feed.querySelectorAll('.news-item').length;
  feed.innerHTML = items.map(n => `
    <a class="news-item" href="${n.link}" target="_blank" rel="noopener">
      <div class="news-item-top">
        <span class="news-tag ${n.severity}">${n.severity.toUpperCase()}</span>
        <span class="news-source">${n.source}</span>
      </div>
      <p>${n.title}</p>
      <span class="news-time">${n.time}</span>
    </a>
  `).join('');

  if (prev > 0 && items.some(i => i.severity === 'critical')) {
    window.Sounds?.alert();
  }
}

function showNewsError() {
  feed.innerHTML = `
    <div class="news-item">
      <span class="news-tag warning">OFFLINE</span>
      <p>Unable to reach threat intelligence feeds. Retrying...</p>
      <span class="news-time">--</span>
    </div>`;
}

function severityClass(sev) {
  const s = (sev || '').toUpperCase();
  if (s === 'CRITICAL') return 'critical';
  if (s === 'HIGH')     return 'warning';
  if (s === 'MEDIUM')   return 'info';
  return 'info';
}

function renderCves(items) {
  if (!items.length) {
    cveFeed.innerHTML = '<div class="news-item"><span class="news-tag info">EMPTY</span><p>No recent CVEs found.</p></div>';
    return;
  }
  cveFeed.innerHTML = items.map(c => {
    const sc    = severityClass(c.severity);
    const score = c.score !== null ? c.score.toFixed(1) : 'N/A';
    const desc  = c.description.length > 160 ? c.description.slice(0, 160) + '…' : c.description;
    const date  = c.published ? new Date(c.published).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '';
    const nvdUrl = `https://nvd.nist.gov/vuln/detail/${c.id}`;
    return `
      <a class="news-item cve-news-item" href="${nvdUrl}" target="_blank" rel="noopener">
        <div class="news-item-top">
          <span class="news-tag ${sc}">${c.id}</span>
          <span class="cve-score-badge ${sc}">CVSS ${score}</span>
        </div>
        <p>${desc}</p>
        <span class="news-time">${date}</span>
      </a>`;
  }).join('');
}

async function refreshCves() {
  try {
    const res = await fetch('/api/cve/recent');
    if (!res.ok) throw new Error('bad response');
    const items = await res.json();
    renderCves(items);
    cveLoaded = true;
  } catch {
    cveFeed.innerHTML = '<div class="news-item"><span class="news-tag warning">OFFLINE</span><p>Unable to reach CVE feed.</p></div>';
  }
}

tabNews.addEventListener('click', () => {
  tabNews.classList.add('active');
  tabCve.classList.remove('active');
  feed.classList.remove('hidden');
  cveFeed.classList.add('hidden');
  window.Sounds?.click();
});

tabCve.addEventListener('click', () => {
  tabCve.classList.add('active');
  tabNews.classList.remove('active');
  cveFeed.classList.remove('hidden');
  feed.classList.add('hidden');
  window.Sounds?.click();
  if (!cveLoaded) refreshCves();
});

async function refreshNews() {
  try {
    const res = await fetch('/api/news');
    if (!res.ok) throw new Error('bad response');
    const items = await res.json();
    if (items.length > 0) renderNews(items);
    else showNewsError();
  } catch {
    showNewsError();
  }
}

refreshNews();
setInterval(refreshNews, 5 * 60 * 1000);
setInterval(() => { cveLoaded = false; if (!cveFeed.classList.contains('hidden')) refreshCves(); }, 60 * 60 * 1000);

// ── Chart.js setup ──
const canvas = document.getElementById('attackChart');

Chart.defaults.color      = 'rgba(0,229,255,0.5)';
Chart.defaults.font.family = "'Share Tech Mono', monospace";
Chart.defaults.font.size   = 11;

const attackChart = new Chart(canvas, {
  type: 'bar',
  data: {
    labels: [],
    datasets: [{
      label: 'Attacks',
      data: [],
      backgroundColor: ctx => {
        const { ctx: c, chartArea } = ctx.chart;
        if (!chartArea) return 'rgba(0,229,255,0.5)';
        const grad = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        grad.addColorStop(0, 'rgba(0,229,255,0.8)');
        grad.addColorStop(1, 'rgba(0,229,255,0.1)');
        return grad;
      },
      borderColor: 'rgba(0,229,255,0.9)',
      borderWidth: 1,
      borderRadius: 2,
      hoverBackgroundColor: 'rgba(0,255,136,0.7)',
      hoverBorderColor: '#00ff88',
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 600, easing: 'easeInOutQuart' },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(10,10,20,0.95)',
        borderColor: 'rgba(0,229,255,0.6)',
        borderWidth: 1,
        titleColor: '#00e5ff',
        bodyColor: '#c0c0d0',
        padding: 10,
        callbacks: {
          title: items => `[ ${items[0].label} ]`,
          label: item  => `  ATTACKS: ${item.raw.toLocaleString()}`,
        }
      }
    },
    scales: {
      x: {
        grid:   { color: 'rgba(0,229,255,0.05)', drawTicks: false },
        border: { color: 'rgba(0,229,255,0.15)' },
        ticks:  { maxTicksLimit: 8, color: 'rgba(0,229,255,0.45)' },
      },
      y: {
        grid:   { color: 'rgba(0,229,255,0.05)', drawTicks: false },
        border: { color: 'rgba(0,229,255,0.15)', dash: [4,4] },
        ticks:  {
          color: 'rgba(0,229,255,0.45)',
          callback: v => v >= 1000 ? (v/1000).toFixed(1)+'k' : v,
        },
      }
    }
  }
});

// ── Animated counter ──
function animateCount(el, target) {
  const current = parseInt(el.textContent.replace(/,/g, '')) || 0;
  const diff    = target - current;
  const steps   = 30;
  let step = 0;
  const timer = setInterval(() => {
    step++;
    el.textContent = Math.round(current + (diff * step) / steps).toLocaleString();
    if (step >= steps) clearInterval(timer);
  }, 20);
}

// ── Chart range tabs ──
let currentRange = 'day';
document.querySelectorAll('.range-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.range-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentRange = btn.dataset.range;
    window.Sounds?.click();
    refreshChart();
  });
});

// ── Fetch and render chart + topbar counter ──
async function refreshChart() {
  try {
    if (currentRange === 'day') {
      // Live generated data for current day
      const res = await fetch('/api/attacks');
      const { hours, data, total, weekTotal, peakHour } = await res.json();
      attackChart.data.labels           = hours;
      attackChart.data.datasets[0].data = data;
      attackChart.update();
      animateCount(document.getElementById('todayCount'),       total);
      animateCount(document.getElementById('weekCount'),        weekTotal);
      animateCount(document.getElementById('totalAttackCount'), total);
      document.getElementById('peakHour').textContent = peakHour;
    } else {
      // Historical data from SQLite
      const res  = await fetch(`/api/history/${currentRange}`);
      const rows = await res.json();
      const labels = rows.map(r => r.day || r.hour);
      const data   = rows.map(r => r.count);
      attackChart.data.labels           = labels.length > 0 ? labels : ['No data yet'];
      attackChart.data.datasets[0].data = data.length > 0 ? data : [0];
      attackChart.update();
      if (data.length > 0) {
        const total = data.reduce((a,b) => a+b, 0);
        const peak  = labels[data.indexOf(Math.max(...data))];
        animateCount(document.getElementById('todayCount'), total);
        document.getElementById('peakHour').textContent = peak || '--';
      }
    }
  } catch (e) {
    console.error('Failed to fetch chart data:', e);
  }
}

refreshChart();
setInterval(refreshChart, 30000);

// ── Top Attackers Leaderboard ──
async function refreshLeaders() {
  const list = document.getElementById('leadersList');
  if (!list) return;
  try {
    const res = await fetch('/api/top-countries');
    const rows = await res.json();
    if (!rows.length) { list.innerHTML = '<li class="leaders-loading">NO DATA YET</li>'; return; }
    const max = rows[0].count;
    list.innerHTML = rows.map((r, i) => `
      <li class="leaders-item">
        <span class="leaders-rank">${String(i + 1).padStart(2, '0')}</span>
        <span class="leaders-country">${r.country || 'UNKNOWN'}</span>
        <div class="leaders-bar-wrap">
          <div class="leaders-bar" style="width:${Math.round((r.count / max) * 100)}%"></div>
        </div>
        <span class="leaders-count">${r.count}</span>
      </li>
    `).join('');
  } catch {
    if (list) list.innerHTML = '<li class="leaders-loading">OFFLINE</li>';
  }
}

refreshLeaders();
setInterval(refreshLeaders, 60000);

// ── Keyboard shortcuts + arrow-key nav on sidebar ──
const KEY_MAP = { d: 'dashboard', t: 'threatmap', a: 'analytics', i: 'iplookup', s: 'settings' };
const navItems = Array.from(document.querySelectorAll('.nav-item'));

// Announce page changes to screen readers
function srAnnounce(msg) {
  const el = document.getElementById('srLive');
  if (!el) return;
  el.textContent = '';
  requestAnimationFrame(() => { el.textContent = msg; });
}

// Arrow keys cycle through sidebar nav items
document.querySelector('.nav-list')?.addEventListener('keydown', e => {
  if (!['ArrowUp', 'ArrowDown', 'Enter', ' '].includes(e.key)) return;
  e.preventDefault();
  const focused = document.activeElement;
  const idx = navItems.indexOf(focused);
  if (e.key === 'ArrowDown') navItems[(idx + 1) % navItems.length]?.focus();
  if (e.key === 'ArrowUp')   navItems[(idx - 1 + navItems.length) % navItems.length]?.focus();
  if (e.key === 'Enter' || e.key === ' ') focused.click();
});

// Enter/Space on nav items (tabindex="0") triggers navigation
navItems.forEach(item => {
  item.addEventListener('click', () => {
    const page = item.dataset.page;
    const label = item.getAttribute('aria-label') || page;
    navItems.forEach(n => n.setAttribute('aria-current', 'false'));
    item.setAttribute('aria-current', 'page');
    srAnnounce(`Navigated to ${label}`);
  });
});

window.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.metaKey || e.ctrlKey || e.altKey) return;
  const page = KEY_MAP[e.key.toLowerCase()];
  if (!page) return;
  const navItem = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (navItem) { window.Sounds?.click(); navItem.click(); }
});

// Sync sound button aria-pressed state
document.getElementById('soundToggle')?.addEventListener('click', function() {
  const isOn = this.classList.contains('sound-on');
  this.setAttribute('aria-pressed', String(isOn));
});

// Sidebar toggle aria-expanded
document.getElementById('sidebarToggle')?.addEventListener('click', function() {
  const sidebar = document.getElementById('sidebar');
  const collapsed = sidebar?.classList.contains('collapsed');
  this.setAttribute('aria-expanded', String(!collapsed));
});
