import { errorScreen } from '../error.js';

const SEVERITY_COLORS = { critical:'#ff2d55', warning:'#ffd700', info:'#00e5ff' };
let globeInstance = null;

export function mountThreatMap(container) {
  try {
  container.innerHTML = `
    <div class="tm-shell">
      <div class="tm-controls panel">
        <div class="panel-header">
          <span class="panel-title">[ FILTERS ]</span>
        </div>
        <div class="tm-filter-body">
          <label class="tm-filter-label">SEVERITY</label>
          <div class="tm-filter-group" id="tmSeverityFilter">
            <button class="tm-filter-btn active" data-sev="all">ALL</button>
            <button class="tm-filter-btn" data-sev="critical">CRITICAL</button>
            <button class="tm-filter-btn" data-sev="warning">WARNING</button>
            <button class="tm-filter-btn" data-sev="info">INFO</button>
          </div>
          <div class="tm-stat-block">
            <div class="tm-stat"><span>CRITICAL</span><span id="tmCritCount" class="tm-stat-val critical">0</span></div>
            <div class="tm-stat"><span>WARNING</span><span id="tmWarnCount" class="tm-stat-val warning">0</span></div>
            <div class="tm-stat"><span>INFO</span><span id="tmInfoCount" class="tm-stat-val info">0</span></div>
          </div>
        </div>
      </div>
      <div class="tm-globe-wrap panel">
        <div class="panel-header">
          <span class="panel-title">[ GLOBAL THREAT MAP ]</span>
          <span class="panel-badge live">LIVE</span>
        </div>
        <div id="tmGlobeContainer"></div>
      </div>
    </div>
  `;

  let allArcs = [];
  let severityFilter = 'all';

  const tmContainer = container.querySelector('#tmGlobeContainer');

  globeInstance = Globe()(tmContainer)
    .globeImageUrl('//unpkg.com/three-globe/example/img/earth-dark.jpg')
    .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
    .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
    .showAtmosphere(true)
    .atmosphereColor('#00e5ff')
    .atmosphereAltitude(0.15)
    .arcsData([])
    .arcStartLat(d => d.srcLat).arcStartLng(d => d.srcLng)
    .arcEndLat(d => d.dstLat).arcEndLng(d => d.dstLng)
    .arcColor(d => SEVERITY_COLORS[d.severity])
    .arcAltitude(0.3)
    .arcStroke(d => d.severity === 'critical' ? 1.0 : 0.6)
    .arcDashLength(0.4).arcDashGap(0.3).arcDashAnimateTime(2000)
    .ringsData([])
    .ringColor(d => SEVERITY_COLORS[d.severity])
    .ringMaxRadius(4).ringPropagationSpeed(2).ringRepeatPeriod(1000)
    .pointsData([])
    .pointColor(d => SEVERITY_COLORS[d.severity])
    .pointAltitude(0.01).pointRadius(0.4)
    .pointLabel(d => `<div class="globe-label"><span>${d.label}</span></div>`);

  globeInstance.controls().autoRotate = true;
  globeInstance.controls().autoRotateSpeed = 0.3;

  function applyFilter() {
    const filtered = severityFilter === 'all' ? allArcs : allArcs.filter(a => a.severity === severityFilter);
    globeInstance.arcsData(filtered);
    globeInstance.ringsData(filtered.flatMap(d => [
      { lat: d.srcLat, lng: d.srcLng, severity: d.severity },
      { lat: d.dstLat, lng: d.dstLng, severity: d.severity },
    ]));
    globeInstance.pointsData(filtered.flatMap(d => [
      { lat: d.srcLat, lng: d.srcLng, severity: d.severity, label: `${d.srcName} (src)` },
      { lat: d.dstLat, lng: d.dstLng, severity: d.severity, label: `${d.dstName} (dst)` },
    ]));
  }

  async function loadArcs() {
    try {
      const res = await fetch('/api/live-attacks');
      allArcs = await res.json();
      applyFilter();
      container.querySelector('#tmCritCount').textContent = allArcs.filter(a => a.severity === 'critical').length;
      container.querySelector('#tmWarnCount').textContent = allArcs.filter(a => a.severity === 'warning').length;
      container.querySelector('#tmInfoCount').textContent = allArcs.filter(a => a.severity === 'info').length;
    } catch (e) { console.error('ThreatMap fetch failed:', e); }
  }

  container.querySelectorAll('.tm-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.tm-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      severityFilter = btn.dataset.sev;
      applyFilter();
      window.Sounds?.click();
    });
  });

  function resize() {
    if (!tmContainer) return;
    globeInstance.width(tmContainer.clientWidth).height(tmContainer.clientHeight);
  }
  resize();
  window._tmResize = resize;
  window.addEventListener('resize', window._tmResize);

  loadArcs();
  } catch (e) {
    errorScreen(container, e.message, () => mountThreatMap(container));
  }
}

export function unmountThreatMap() {
  if (window._tmResize) window.removeEventListener('resize', window._tmResize);
  globeInstance = null;
}
