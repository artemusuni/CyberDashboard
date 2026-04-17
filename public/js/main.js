// ── Clock ──
function updateClock() {
  const now = new Date();
  document.getElementById('clock').textContent =
    now.toUTCString().replace('GMT', 'UTC');
}
updateClock();
setInterval(updateClock, 1000);

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

// ── Chart.js setup ──
const canvas = document.getElementById('attackChart');

Chart.defaults.color = 'rgba(0,229,255,0.5)';
Chart.defaults.font.family = "'Share Tech Mono', monospace";
Chart.defaults.font.size = 11;

const attackChart = new Chart(canvas, {
  type: 'bar',
  data: {
    labels: [],
    datasets: [
      {
        label: 'Attacks',
        data: [],
        backgroundColor: ctx => {
          const chart = ctx.chart;
          const { ctx: c, chartArea } = chart;
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
      }
    ]
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
          label: item => `  ATTACKS: ${item.raw.toLocaleString()}`,
        }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(0,229,255,0.05)', drawTicks: false },
        border: { color: 'rgba(0,229,255,0.15)' },
        ticks: {
          maxTicksLimit: 8,
          color: 'rgba(0,229,255,0.45)',
        }
      },
      y: {
        grid: { color: 'rgba(0,229,255,0.05)', drawTicks: false },
        border: { color: 'rgba(0,229,255,0.15)', dash: [4, 4] },
        ticks: {
          color: 'rgba(0,229,255,0.45)',
          callback: v => v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v,
        }
      }
    }
  }
});

// ── Animated counter ──
function animateCount(el, target) {
  const current = parseInt(el.textContent.replace(/,/g, '')) || 0;
  const diff = target - current;
  const steps = 30;
  let step = 0;
  const timer = setInterval(() => {
    step++;
    const val = Math.round(current + (diff * step) / steps);
    el.textContent = val.toLocaleString();
    if (step >= steps) clearInterval(timer);
  }, 20);
}

// ── Fetch and render chart data ──
async function refreshChart() {
  try {
    const res = await fetch('/api/attacks');
    const { hours, data, total, weekTotal, peakHour } = await res.json();

    attackChart.data.labels = hours;
    attackChart.data.datasets[0].data = data;
    attackChart.update();

    animateCount(document.getElementById('todayCount'), total);
    animateCount(document.getElementById('weekCount'), weekTotal);
    document.getElementById('peakHour').textContent = peakHour;
  } catch (e) {
    console.error('Failed to fetch attack data:', e);
  }
}

refreshChart();
setInterval(refreshChart, 30000);
