import { errorScreen } from '../error.js';

let charts = [];

function destroyCharts() {
  charts.forEach(c => c.destroy());
  charts = [];
}

const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 500 },
  plugins: { legend: { display: false } },
};

function neonBar(ctx, labels, data, color = '#00e5ff') {
  const grad = ctx.createLinearGradient(0, 0, 0, 200);
  grad.addColorStop(0, color + 'cc');
  grad.addColorStop(1, color + '11');
  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: grad,
        borderColor: color,
        borderWidth: 1,
        borderRadius: 2,
        hoverBackgroundColor: color + 'aa',
      }]
    },
    options: {
      ...CHART_DEFAULTS,
      scales: {
        x: { grid: { color: 'rgba(0,229,255,0.05)' }, ticks: { color: 'rgba(0,229,255,0.4)', font: { family: 'Share Tech Mono' } } },
        y: { grid: { color: 'rgba(0,229,255,0.05)' }, ticks: { color: 'rgba(0,229,255,0.4)', font: { family: 'Share Tech Mono' } } },
      }
    }
  });
}

function skBars(n = 7) {
  const heights = [40, 65, 80, 55, 90, 70, 45, 60, 75, 50].slice(0, n);
  return heights.map(h => `<div class="sk sk-bar-col" style="height:${h}%"></div>`).join('');
}

export async function mountAnalytics(container) {
  try {
  container.innerHTML = `
    <div class="analytics-shell">
      <div class="analytics-header">
        <div>
          <span class="page-title">[ ANALYTICS ]</span>
          <span class="page-sub">Historical attack intelligence</span>
        </div>
        <div class="analytics-export-group">
          <button class="export-btn" id="exportWeek">&#8595; 7D CSV</button>
          <button class="export-btn" id="exportMonth">&#8595; 30D CSV</button>
          <button class="export-btn" id="exportCountries">&#8595; COUNTRIES CSV</button>
        </div>
      </div>
      <div class="analytics-grid">

        <div class="panel analytics-panel">
          <div class="panel-header">
            <span class="panel-title">[ ATTACKS — LAST 7 DAYS ]</span>
          </div>
          <div class="analytics-chart-wrap">
            <div class="sk-chart" id="skWeek">${skBars()}</div>
            <canvas id="chartWeek" hidden></canvas>
          </div>
        </div>

        <div class="panel analytics-panel">
          <div class="panel-header">
            <span class="panel-title">[ ATTACKS — LAST 30 DAYS ]</span>
          </div>
          <div class="analytics-chart-wrap">
            <div class="sk-chart" id="skMonth">${skBars()}</div>
            <canvas id="chartMonth" hidden></canvas>
          </div>
        </div>

        <div class="panel analytics-panel">
          <div class="panel-header">
            <span class="panel-title">[ TOP ATTACKER COUNTRIES ]</span>
          </div>
          <div class="analytics-chart-wrap">
            <div class="sk-chart" id="skCountries">${skBars()}</div>
            <canvas id="chartCountries" hidden></canvas>
          </div>
        </div>

        <div class="panel analytics-panel">
          <div class="panel-header">
            <span class="panel-title">[ SEVERITY BREAKDOWN ]</span>
          </div>
          <div class="analytics-chart-wrap">
            <div class="sk-donut" id="skSeverity"><div class="sk-donut-ring"></div></div>
            <canvas id="chartSeverity" hidden></canvas>
          </div>
        </div>

      </div>
    </div>
  `;

  destroyCharts();

  try {
    const [weekRes, monthRes, countriesRes, liveRes] = await Promise.all([
      fetch('/api/history/week'),
      fetch('/api/history/month'),
      fetch('/api/top-countries'),
      fetch('/api/live-attacks'),
    ]);

    const week      = await weekRes.json();
    const month     = await monthRes.json();
    const countries = await countriesRes.json();
    const live      = await liveRes.json();

    function showChart(skId, canvasId) {
      document.getElementById(skId).remove();
      document.getElementById(canvasId).hidden = false;
    }

    // Week chart
    showChart('skWeek', 'chartWeek');
    charts.push(neonBar(
      document.getElementById('chartWeek').getContext('2d'),
      week.map(r => r.day?.slice(5) || r.hour),
      week.map(r => r.count),
    ));

    // Month chart
    showChart('skMonth', 'chartMonth');
    charts.push(neonBar(
      document.getElementById('chartMonth').getContext('2d'),
      month.map(r => r.day?.slice(5) || r.hour),
      month.map(r => r.count),
      '#00ff88'
    ));

    // Top countries chart
    showChart('skCountries', 'chartCountries');
    charts.push(neonBar(
      document.getElementById('chartCountries').getContext('2d'),
      countries.map(c => c.country),
      countries.map(c => c.count),
      '#ffd700'
    ));

    // Severity doughnut
    showChart('skSeverity', 'chartSeverity');
    const crit = live.filter(a => a.severity === 'critical').length;
    const warn = live.filter(a => a.severity === 'warning').length;
    const info = live.filter(a => a.severity === 'info').length;
    charts.push(new Chart(document.getElementById('chartSeverity').getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: ['CRITICAL', 'WARNING', 'INFO'],
        datasets: [{
          data: [crit, warn, info],
          backgroundColor: ['rgba(255,45,85,0.7)', 'rgba(255,215,0,0.7)', 'rgba(0,229,255,0.7)'],
          borderColor:     ['#ff2d55', '#ffd700', '#00e5ff'],
          borderWidth: 1,
          hoverOffset: 6,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 500 },
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: { color: 'rgba(0,229,255,0.6)', font: { family: 'Share Tech Mono', size: 11 }, padding: 16 }
          }
        }
      }
    }));

    // ── CSV Export ──
    function downloadCsv(filename, headers, rows) {
      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const a = Object.assign(document.createElement('a'), {
        href: 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv),
        download: filename,
      });
      a.click();
      window.Sounds?.click();
    }

    container.querySelector('#exportWeek').addEventListener('click', () =>
      downloadCsv('attacks_7d.csv', ['date','count'], week.map(r => [r.day || r.hour, r.count]))
    );
    container.querySelector('#exportMonth').addEventListener('click', () =>
      downloadCsv('attacks_30d.csv', ['date','count'], month.map(r => [r.day || r.hour, r.count]))
    );
    container.querySelector('#exportCountries').addEventListener('click', () =>
      downloadCsv('top_countries.csv', ['country','count'], countries.map(c => [JSON.stringify(c.country), c.count]))
    );

  } catch (e) {
    container.querySelector('.analytics-grid').innerHTML =
      `<div class="page-error"><span class="news-tag warning">ERROR</span><p>${e.message}</p></div>`;
  }
  } catch (e) {
    errorScreen(container, e.message, () => mountAnalytics(container));
  }
}

export function unmountAnalytics() {
  destroyCharts();
}
