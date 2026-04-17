const BOOT_LINES = [
  '> INITIALIZING CYBERDASHBOARD v1.0...',
  '> LOADING THREAT INTELLIGENCE MODULES...',
  '> CONNECTING TO ABUSEIPDB FEED............OK',
  '> MOUNTING RSS PARSERS....................OK',
  '> CALIBRATING GLOBAL ATTACK SENSORS......OK',
  '> RENDERING 3D ATTACK SURFACE............OK',
  '> ESTABLISHING SECURE CHANNEL............OK',
  '> ALL SYSTEMS NOMINAL',
  '> LAUNCHING DASHBOARD...',
];

const overlay  = document.getElementById('bootOverlay');
const linesEl  = document.getElementById('bootLines');
const barEl    = document.getElementById('bootBar');

let lineIdx = 0;

function typeLine(text, cb) {
  const el  = document.createElement('div');
  el.className = 'boot-line';
  linesEl.appendChild(el);

  let i = 0;
  const interval = setInterval(() => {
    el.textContent += text[i++];
    if (i >= text.length) {
      clearInterval(interval);
      setTimeout(cb, 80);
    }
  }, 18);
}

function nextLine() {
  if (lineIdx >= BOOT_LINES.length) {
    barEl.style.width = '100%';
    setTimeout(() => {
      overlay.classList.add('boot-done');
      setTimeout(() => overlay.remove(), 600);
    }, 400);
    return;
  }
  const pct = Math.round(((lineIdx + 1) / BOOT_LINES.length) * 100);
  barEl.style.width = pct + '%';
  typeLine(BOOT_LINES[lineIdx++], nextLine);
}

// Small delay so fonts load before boot starts
setTimeout(nextLine, 300);
