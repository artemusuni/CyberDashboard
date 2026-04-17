const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

// ── Attack data generator ──
function generateHourlyData() {
  const now = new Date();
  const currentHour = now.getHours();
  const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

  // Simulate realistic attack patterns: higher at night UTC, spikes around 02-04, 14-16
  const base = [120,180,340,420,390,310,260,200,190,210,280,330,360,400,430,410,380,320,290,260,230,200,160,130];
  const data = base.map((v, i) => {
    const jitter = Math.floor((Math.random() - 0.5) * 80);
    // Hours in the future get 0 (not happened yet)
    return i <= currentHour ? Math.max(50, v + jitter) : 0;
  });

  const filled = data.filter(v => v > 0);
  const total  = filled.reduce((a, b) => a + b, 0);
  const peak   = data.indexOf(Math.max(...filled));

  return { hours, data, total, weekTotal: total * 7, peakHour: hours[peak] };
}

app.get('/api/attacks', (req, res) => {
  res.json(generateHourlyData());
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`CyberDashboard running at http://localhost:${PORT}`);
});
