// ── Clock ──
function updateClock() {
  const now = new Date();
  document.getElementById('clock').textContent =
    now.toUTCString().replace('GMT', 'UTC');
}
updateClock();
setInterval(updateClock, 1000);

// ── Globe placeholder ──
const globeContainer = document.getElementById('globeContainer');
globeContainer.innerHTML = `
  <div class="globe-placeholder">
    <div class="spinner"></div>
    <span>INITIALIZING GLOBE...</span>
  </div>
`;

// ── News placeholder items ──
const sampleNews = [
  { tag: 'critical', title: 'Ransomware group targets EU healthcare infrastructure', time: '2m ago' },
  { tag: 'warning',  title: 'New zero-day in OpenSSH actively exploited in the wild', time: '14m ago' },
  { tag: 'info',     title: 'CISA issues advisory on critical ICS vulnerabilities', time: '31m ago' },
  { tag: 'warning',  title: 'DDoS attacks spike 40% targeting financial sector', time: '58m ago' },
  { tag: 'critical', title: 'Supply chain attack compromises popular npm package', time: '1h ago' },
  { tag: 'info',     title: 'Patch Tuesday: Microsoft fixes 4 zero-days', time: '2h ago' },
];

const feed = document.getElementById('newsFeed');
feed.innerHTML = sampleNews.map(n => `
  <div class="news-item">
    <span class="news-tag ${n.tag}">${n.tag.toUpperCase()}</span>
    <p>${n.title}</p>
    <span class="news-time">${n.time}</span>
  </div>
`).join('');

// ── Chart placeholder (Chart.js will be wired in Phase 4) ──
const canvas = document.getElementById('attackChart');
const ctx = canvas.getContext('2d');

function drawPlaceholderChart() {
  const w = canvas.width  = canvas.offsetWidth;
  const h = canvas.height = canvas.offsetHeight;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(0,229,255,0.06)';
  ctx.strokeStyle = 'rgba(0,229,255,0.5)';
  ctx.lineWidth = 1.5;

  const labels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2,'0')}:00`);
  const data   = Array.from({ length: 24 }, () => Math.floor(Math.random() * 800 + 100));

  const padL = 40, padR = 16, padT = 16, padB = 28;
  const cw = w - padL - padR;
  const ch = h - padT - padB;
  const max = Math.max(...data);

  // Grid lines
  ctx.strokeStyle = 'rgba(0,229,255,0.08)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padT + (ch / 4) * i;
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + cw, y); ctx.stroke();
    ctx.fillStyle = 'rgba(0,229,255,0.4)';
    ctx.font = '10px Share Tech Mono';
    ctx.fillText(Math.round(max - (max / 4) * i), 4, y + 4);
  }

  // Area fill
  ctx.beginPath();
  data.forEach((v, i) => {
    const x = padL + (cw / 23) * i;
    const y = padT + ch - (v / max) * ch;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.lineTo(padL + cw, padT + ch);
  ctx.lineTo(padL, padT + ch);
  ctx.closePath();
  const grad = ctx.createLinearGradient(0, padT, 0, padT + ch);
  grad.addColorStop(0, 'rgba(0,229,255,0.25)');
  grad.addColorStop(1, 'rgba(0,229,255,0.01)');
  ctx.fillStyle = grad;
  ctx.fill();

  // Line
  ctx.beginPath();
  ctx.strokeStyle = 'rgba(0,229,255,0.9)';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#00e5ff';
  ctx.shadowBlur = 8;
  data.forEach((v, i) => {
    const x = padL + (cw / 23) * i;
    const y = padT + ch - (v / max) * ch;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.shadowBlur = 0;

  // X labels (every 4h)
  ctx.fillStyle = 'rgba(0,229,255,0.4)';
  ctx.font = '10px Share Tech Mono';
  labels.forEach((l, i) => {
    if (i % 4 === 0) {
      const x = padL + (cw / 23) * i;
      ctx.fillText(l, x - 14, h - 6);
    }
  });

  // Stats
  const total = data.reduce((a, b) => a + b, 0);
  const peakIdx = data.indexOf(max);
  document.getElementById('todayCount').textContent = total.toLocaleString();
  document.getElementById('weekCount').textContent  = (total * 7).toLocaleString();
  document.getElementById('peakHour').textContent   = labels[peakIdx];
}

drawPlaceholderChart();
window.addEventListener('resize', drawPlaceholderChart);
