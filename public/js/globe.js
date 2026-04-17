import { showIpReport } from './ippanel.js';

const SEVERITY_COLORS = {
  critical: '#ff2d55',
  warning:  '#ffd700',
  info:     '#00e5ff',
};

// ── Tooltip ──
const tooltip = document.createElement('div');
tooltip.id = 'globeTooltip';
document.body.appendChild(tooltip);

const container = document.getElementById('globeContainer');

// ── Init Globe ──
const globe = Globe()(container)
  .globeImageUrl('//unpkg.com/three-globe/example/img/earth-dark.jpg')
  .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
  .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
  .showAtmosphere(true)
  .atmosphereColor('#00e5ff')
  .atmosphereAltitude(0.12)
  .arcsData([])
  .arcStartLat(d => d.srcLat)
  .arcStartLng(d => d.srcLng)
  .arcEndLat(d => d.dstLat)
  .arcEndLng(d => d.dstLng)
  .arcColor(d => SEVERITY_COLORS[d.severity])
  .arcAltitude(0.25)
  .arcStroke(d => d.severity === 'critical' ? 0.8 : 0.5)
  .arcDashLength(0.4)
  .arcDashGap(0.3)
  .arcDashAnimateTime(2200)
  .ringsData([])
  .ringColor(d => SEVERITY_COLORS[d.severity])
  .ringMaxRadius(3)
  .ringPropagationSpeed(2)
  .ringRepeatPeriod(1200)
  .pointsData([])
  .pointColor(d => SEVERITY_COLORS[d.severity])
  .pointAltitude(0.01)
  .pointRadius(0.35)
  .pointLabel(d => `<div class="globe-label"><span>${d.label}</span></div>`)
  .onArcHover(arc => {
    if (arc) {
      tooltip.style.display = 'block';
      tooltip.innerHTML = `
        <div class="tt-tag ${arc.severity}">${arc.severity.toUpperCase()}</div>
        <div class="tt-route">${arc.srcName} → ${arc.dstName}</div>
        <div class="tt-detail">IP: ${arc.ip}</div>
        <div class="tt-detail">Reports: ${arc.reports} &nbsp;|&nbsp; Score: ${arc.score}</div>
        <div class="tt-click-hint">Click for full report</div>
      `;
      container.style.cursor = 'pointer';
    } else {
      tooltip.style.display = 'none';
      container.style.cursor = '';
    }
  })
  .onArcClick(arc => {
    if (arc) showIpReport(arc.ip, arc.srcName, arc.dstName, arc.severity);
  });

globe.controls().autoRotate      = true;
globe.controls().autoRotateSpeed = 0.4;
globe.controls().enableZoom      = true;

container.addEventListener('mousemove', e => {
  tooltip.style.left = (e.clientX + 14) + 'px';
  tooltip.style.top  = (e.clientY - 10) + 'px';
});

// ── Attack counter ──
let totalAttacks = 0;
const counterEl  = document.getElementById('liveAttackCount');

function bumpCounter(n) {
  totalAttacks += n;
  if (counterEl) counterEl.textContent = totalAttacks.toLocaleString();
}

// ── Load live arcs from API ──
async function refreshGlobe() {
  try {
    const res  = await fetch('/api/live-attacks');
    if (!res.ok) throw new Error('bad response');
    const arcs = await res.json();

    globe.arcsData(arcs);
    globe.ringsData(arcs.flatMap(d => [
      { lat: d.srcLat, lng: d.srcLng, severity: d.severity },
      { lat: d.dstLat, lng: d.dstLng, severity: d.severity },
    ]));
    globe.pointsData(arcs.flatMap(d => [
      { lat: d.srcLat, lng: d.srcLng, severity: d.severity, label: `${d.srcName} (attacker)` },
      { lat: d.dstLat, lng: d.dstLng, severity: d.severity, label: `${d.dstName} (target)` },
    ]));

    bumpCounter(arcs.length);
    showFlash(arcs);
  } catch (e) {
    console.error('Globe refresh failed:', e);
  }
}

// ── Flash notifications for top critical arcs ──
let flashIdx = 0;
function showFlash(arcs) {
  const critical = arcs.filter(a => a.severity === 'critical');
  if (critical.length === 0) return;
  const arc = critical[flashIdx % critical.length];
  flashIdx++;
  const el  = document.createElement('div');
  el.className   = 'attack-flash';
  el.textContent = `! ATTACK DETECTED: ${arc.srcName} → ${arc.dstName}`;
  el.style.borderColor = SEVERITY_COLORS[arc.severity];
  el.style.color       = SEVERITY_COLORS[arc.severity];
  el.style.boxShadow   = `0 0 10px ${SEVERITY_COLORS[arc.severity]}55`;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3000);
  window.Sounds?.critical();
}

// ── Responsive ──
function resizeGlobe() {
  globe.width(container.clientWidth).height(container.clientHeight);
}
resizeGlobe();
window.addEventListener('resize', resizeGlobe);

refreshGlobe();
setInterval(refreshGlobe, 2 * 60 * 1000);
setInterval(() => showFlash(globe.arcsData()), 5000);
