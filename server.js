const express = require('express');
const path    = require('path');
const Parser  = require('rss-parser');

const app    = express();
const PORT   = process.env.PORT || 3000;
const parser = new Parser({ timeout: 8000 });

// ── RSS sources ──
const FEEDS = [
  { url: 'https://feeds.feedburner.com/TheHackersNews', source: 'The Hacker News' },
  { url: 'https://www.bleepingcomputer.com/feed/',      source: 'BleepingComputer' },
  { url: 'https://www.cisa.gov/cybersecurity-advisories/all.xml', source: 'CISA' },
];

const CRITICAL_KEYWORDS = ['zero-day','0-day','ransomware','critical','rce','remote code','exploit','breach','backdoor','apt'];
const WARNING_KEYWORDS  = ['vulnerability','cve','patch','advisory','malware','phishing','ddos','botnet','leak'];

function classifySeverity(text) {
  const lower = text.toLowerCase();
  if (CRITICAL_KEYWORDS.some(k => lower.includes(k))) return 'critical';
  if (WARNING_KEYWORDS.some(k => lower.includes(k)))  return 'warning';
  return 'info';
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)   return 'just now';
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Cache so we don't hammer RSS sources ──
let newsCache   = [];
let lastFetched = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function fetchNews() {
  if (Date.now() - lastFetched < CACHE_TTL && newsCache.length > 0) {
    return newsCache;
  }

  const results = await Promise.allSettled(
    FEEDS.map(f => parser.parseURL(f.url).then(feed =>
      feed.items.slice(0, 8).map(item => ({
        title:    item.title || 'Untitled',
        link:     item.link  || '#',
        time:     timeAgo(item.pubDate || item.isoDate),
        source:   f.source,
        severity: classifySeverity((item.title || '') + ' ' + (item.contentSnippet || '')),
      }))
    ))
  );

  const items = results
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => r.value)
    .sort((a, b) => {
      const order = { critical: 0, warning: 1, info: 2 };
      return order[a.severity] - order[b.severity];
    });

  newsCache   = items.length > 0 ? items : newsCache;
  lastFetched = Date.now();
  return newsCache;
}

// ── Attack data generator ──
function generateHourlyData() {
  const now = new Date();
  const currentHour = now.getHours();
  const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
  const base  = [120,180,340,420,390,310,260,200,190,210,280,330,360,400,430,410,380,320,290,260,230,200,160,130];
  const data  = base.map((v, i) => {
    const jitter = Math.floor((Math.random() - 0.5) * 80);
    return i <= currentHour ? Math.max(50, v + jitter) : 0;
  });
  const filled    = data.filter(v => v > 0);
  const total     = filled.reduce((a, b) => a + b, 0);
  const peak      = data.indexOf(Math.max(...filled));
  return { hours, data, total, weekTotal: total * 7, peakHour: hours[peak] };
}

// ── Routes ──
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/attacks', (req, res) => {
  res.json(generateHourlyData());
});

app.get('/api/news', async (req, res) => {
  try {
    const news = await fetchNews();
    res.json(news);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`CyberDashboard running at http://localhost:${PORT}`);
  // Pre-warm news cache on startup
  fetchNews().catch(() => {});
});
