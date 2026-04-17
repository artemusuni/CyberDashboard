// ── Web Audio sound engine ──
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let ctx = null;
let soundEnabled = false;

function getCtx() {
  if (!ctx) ctx = new AudioCtx();
  return ctx;
}

function playTone(freq, type, duration, gain = 0.15) {
  if (!soundEnabled) return;
  try {
    const ac  = getCtx();
    const osc = ac.createOscillator();
    const env = ac.createGain();
    osc.connect(env);
    env.connect(ac.destination);
    osc.type      = type;
    osc.frequency.setValueAtTime(freq, ac.currentTime);
    env.gain.setValueAtTime(gain, ac.currentTime);
    env.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + duration);
  } catch {}
}

window.Sounds = {
  click:    () => playTone(800,  'square',   0.04, 0.08),
  alert:    () => {
    playTone(880, 'sawtooth', 0.12, 0.18);
    setTimeout(() => playTone(660, 'sawtooth', 0.12, 0.18), 140);
  },
  critical: () => {
    playTone(440, 'sawtooth', 0.18, 0.22);
    setTimeout(() => playTone(330, 'sawtooth', 0.18, 0.22), 180);
    setTimeout(() => playTone(220, 'sawtooth', 0.24, 0.22), 360);
  },
  boot:     () => {
    [523, 659, 784, 1046].forEach((f, i) =>
      setTimeout(() => playTone(f, 'square', 0.12, 0.1), i * 100)
    );
  },
};

// ── Toggle button ──
const btn  = document.getElementById('soundToggle');
const icon = document.getElementById('soundIcon');

btn.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  icon.innerHTML = soundEnabled ? '&#128266;' : '&#128263;';
  btn.classList.toggle('sound-on', soundEnabled);
  if (soundEnabled) {
    getCtx(); // unlock audio context on user gesture
    Sounds.boot();
  }
});
