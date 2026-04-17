// ── Attack data: [srcLat, srcLng, dstLat, dstLng, label, severity] ──
const ATTACK_DATA = [
  [55.75, 37.61,  40.71, -74.00, 'RU → US', 'critical'],
  [39.90, 116.39, 51.50,  -0.12, 'CN → GB', 'critical'],
  [35.68, 139.69, 48.85,   2.35, 'JP → FR', 'warning'],
  [37.56, 126.97, 52.52,  13.40, 'KR → DE', 'warning'],
  [28.61,  77.20, 37.77,-122.41, 'IN → US', 'info'],
  [41.00,  28.97, 55.75,  37.61, 'TR → RU', 'warning'],
  [-23.55,-46.63, 40.41,  -3.70, 'BR → ES', 'info'],
  [31.22, 121.47, 19.07,  72.87, 'CN → IN', 'critical'],
  [53.34,  -6.26, 40.71, -74.00, 'IE → US', 'info'],
  [48.20,  16.37, 52.22,  21.01, 'AT → PL', 'warning'],
  [59.93,  30.32, 50.45,  30.52, 'RU → UA', 'critical'],
  [22.28, 114.16, 37.56, 126.97, 'HK → KR', 'warning'],
  [1.35,  103.82, -33.86, 151.21,'SG → AU', 'info'],
  [19.43, -99.13,  4.71, -74.07, 'MX → CO', 'info'],
  [55.75,  37.61, 48.85,   2.35, 'RU → FR', 'critical'],
  [39.90, 116.39, 37.77,-122.41, 'CN → US', 'critical'],
  [51.50,  -0.12, 40.71, -74.00, 'GB → US', 'info'],
  [52.52,  13.40, 41.89,  12.49, 'DE → IT', 'warning'],
  [35.68, 139.69, 37.77,-122.41, 'JP → US', 'warning'],
  [45.42, -75.69, 40.71, -74.00, 'CA → US', 'info'],
];

const SEVERITY_COLORS = {
  critical: '#ff2d55',
  warning:  '#ffd700',
  info:     '#00e5ff',
};

// ── Tooltip element ──
const tooltip = document.createElement('div');
tooltip.id = 'globeTooltip';
document.body.appendChild(tooltip);

// ── Init Globe ──
const container = document.getElementById('globeContainer');

const globe = Globe()(container)
  .globeImageUrl('//unpkg.com/three-globe/example/img/earth-dark.jpg')
  .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
  .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
  .showAtmosphere(true)
  .atmosphereColor('#00e5ff')
  .atmosphereAltitude(0.12)

  // ── Attack arcs ──
  .arcsData(ATTACK_DATA)
  .arcStartLat(d => d[0])
  .arcStartLng(d => d[1])
  .arcEndLat(d => d[2])
  .arcEndLng(d => d[3])
  .arcColor(d => SEVERITY_COLORS[d[4] || 'info'])
  .arcAltitude(0.25)
  .arcStroke(0.5)
  .arcDashLength(0.4)
  .arcDashGap(0.3)
  .arcDashAnimateTime(2200)
  .arcLabel(d => `
    <div class="globe-label">
      <span class="globe-label-tag ${d[4]}">${d[4].toUpperCase()}</span>
      <span>${d[5] || d[4]}</span>
    </div>
  `)

  // ── Origin/destination rings ──
  .ringsData(ATTACK_DATA.flatMap(d => [
    { lat: d[0], lng: d[1], severity: d[4] },
    { lat: d[2], lng: d[3], severity: d[4] },
  ]))
  .ringColor(d => SEVERITY_COLORS[d.severity])
  .ringMaxRadius(3)
  .ringPropagationSpeed(2)
  .ringRepeatPeriod(1200)

  // ── Points at origin/dest ──
  .pointsData(ATTACK_DATA.flatMap(d => [
    { lat: d[0], lng: d[1], severity: d[4], label: d[5] + ' (src)' },
    { lat: d[2], lng: d[3], severity: d[4], label: d[5] + ' (dst)' },
  ]))
  .pointColor(d => SEVERITY_COLORS[d.severity])
  .pointAltitude(0.01)
  .pointRadius(0.35)
  .pointLabel(d => `<div class="globe-label"><span>${d.label}</span></div>`)

  // ── Interaction ──
  .onArcHover(arc => {
    if (arc) {
      tooltip.style.display = 'block';
      tooltip.innerHTML = `
        <div class="tt-tag ${arc[4]}">${arc[4].toUpperCase()}</div>
        <div class="tt-route">${arc[5]}</div>
      `;
    } else {
      tooltip.style.display = 'none';
    }
  });

// ── Tooltip follows mouse ──
container.addEventListener('mousemove', e => {
  tooltip.style.left = (e.clientX + 14) + 'px';
  tooltip.style.top  = (e.clientY - 10) + 'px';
});

// ── Dark globe controls ──
globe.controls().autoRotate = true;
globe.controls().autoRotateSpeed = 0.4;
globe.controls().enableZoom = true;

// ── Responsive resize ──
function resizeGlobe() {
  globe.width(container.clientWidth).height(container.clientHeight);
}
resizeGlobe();
window.addEventListener('resize', resizeGlobe);

// ── Simulate new attacks every 4s ──
let attackIdx = 0;
setInterval(() => {
  const arc = ATTACK_DATA[attackIdx % ATTACK_DATA.length];
  attackIdx++;
  const flash = document.createElement('div');
  flash.className = 'attack-flash';
  flash.textContent = `! NEW ATTACK: ${arc[5]}`;
  flash.style.borderColor = SEVERITY_COLORS[arc[4]];
  flash.style.color = SEVERITY_COLORS[arc[4]];
  flash.style.boxShadow = `0 0 10px ${SEVERITY_COLORS[arc[4]]}55`;
  container.appendChild(flash);
  setTimeout(() => flash.remove(), 3000);
}, 4000);
