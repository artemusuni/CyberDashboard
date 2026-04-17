require('dotenv').config();
const express = require('express');
const path    = require('path');
const fetch   = require('node-fetch');
const Parser  = require('rss-parser');

const app    = express();
const PORT   = process.env.PORT || 3000;
const parser = new Parser({ timeout: 8000 });

// ── Country code → { lat, lng, name } ──
const COUNTRY_COORDS = {
  US:{lat:37.09,lng:-95.71,name:'United States'},  CN:{lat:35.86,lng:104.19,name:'China'},
  RU:{lat:61.52,lng:105.31,name:'Russia'},          DE:{lat:51.16,lng:10.45,name:'Germany'},
  GB:{lat:55.37,lng:-3.43,name:'United Kingdom'},   FR:{lat:46.22,lng:2.21,name:'France'},
  NL:{lat:52.13,lng:5.29,name:'Netherlands'},       BR:{lat:-14.23,lng:-51.92,name:'Brazil'},
  IN:{lat:20.59,lng:78.96,name:'India'},            KR:{lat:35.90,lng:127.76,name:'South Korea'},
  JP:{lat:36.20,lng:138.25,name:'Japan'},           CA:{lat:56.13,lng:-106.34,name:'Canada'},
  AU:{lat:-25.27,lng:133.77,name:'Australia'},      SG:{lat:1.35,lng:103.81,name:'Singapore'},
  HK:{lat:22.39,lng:114.10,name:'Hong Kong'},       TR:{lat:38.96,lng:35.24,name:'Turkey'},
  UA:{lat:48.37,lng:31.16,name:'Ukraine'},          PL:{lat:51.91,lng:19.14,name:'Poland'},
  IT:{lat:41.87,lng:12.56,name:'Italy'},            ES:{lat:40.46,lng:-3.74,name:'Spain'},
  IR:{lat:32.42,lng:53.68,name:'Iran'},             VN:{lat:14.05,lng:108.27,name:'Vietnam'},
  ID:{lat:-0.78,lng:113.92,name:'Indonesia'},       MX:{lat:23.63,lng:-102.55,name:'Mexico'},
  ZA:{lat:-30.55,lng:22.93,name:'South Africa'},    NG:{lat:9.08,lng:8.67,name:'Nigeria'},
  RO:{lat:45.94,lng:24.96,name:'Romania'},          TH:{lat:15.87,lng:100.99,name:'Thailand'},
  PK:{lat:30.37,lng:69.34,name:'Pakistan'},         AR:{lat:-38.41,lng:-63.61,name:'Argentina'},
};

// Common targets for attack arcs
const TARGETS = ['US','GB','DE','FR','JP','AU','CA','SG','NL','IT'];

// ── AbuseIPDB live blacklist ──
let attackCache     = [];
let attackFetchedAt = 0;
const ATTACK_TTL    = 2 * 60 * 1000; // 2 minutes

async function fetchLiveAttacks() {
  if (Date.now() - attackFetchedAt < ATTACK_TTL && attackCache.length > 0) {
    return attackCache;
  }

  const res = await fetch('https://api.abuseipdb.com/api/v2/blacklist?confidenceMinimum=90&limit=100', {
    headers: { Key: process.env.ABUSEIPDB_KEY, Accept: 'application/json' }
  });

  if (!res.ok) throw new Error(`AbuseIPDB ${res.status}`);

  const { data } = await res.json();

  const arcs = data
    .filter(ip => ip.countryCode && COUNTRY_COORDS[ip.countryCode])
    .slice(0, 40)
    .map(ip => {
      const src    = COUNTRY_COORDS[ip.countryCode];
      const dstCode = TARGETS.find(t => t !== ip.countryCode) ||
                      TARGETS[Math.floor(Math.random() * TARGETS.length)];
      const dst    = COUNTRY_COORDS[dstCode];
      const score  = ip.abuseConfidenceScore;
      const severity = score >= 95 ? 'critical' : score >= 85 ? 'warning' : 'info';
      return {
        srcLat: src.lat, srcLng: src.lng, srcName: src.name,
        dstLat: dst.lat, dstLng: dst.lng, dstName: COUNTRY_COORDS[dstCode].name,
        severity,
        score,
        ip: ip.ipAddress,
        reports: ip.totalReports,
      };
    });

  attackCache     = arcs.length > 0 ? arcs : attackCache;
  attackFetchedAt = Date.now();
  return attackCache;
}

// ── RSS news ──
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
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

let newsCache   = [];
let newsFetched = 0;
const NEWS_TTL  = 5 * 60 * 1000;

async function fetchNews() {
  if (Date.now() - newsFetched < NEWS_TTL && newsCache.length > 0) return newsCache;
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
    .sort((a, b) => ({ critical:0, warning:1, info:2 }[a.severity] - { critical:0, warning:1, info:2 }[b.severity]));
  newsCache   = items.length > 0 ? items : newsCache;
  newsFetched = Date.now();
  return newsCache;
}

// ── Attack frequency chart data ──
function generateHourlyData() {
  const now         = new Date();
  const currentHour = now.getHours();
  const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
  const base  = [120,180,340,420,390,310,260,200,190,210,280,330,360,400,430,410,380,320,290,260,230,200,160,130];
  const data  = base.map((v, i) => {
    const jitter = Math.floor((Math.random() - 0.5) * 80);
    return i <= currentHour ? Math.max(50, v + jitter) : 0;
  });
  const filled = data.filter(v => v > 0);
  const total  = filled.reduce((a, b) => a + b, 0);
  const peak   = data.indexOf(Math.max(...filled));
  return { hours, data, total, weekTotal: total * 7, peakHour: hours[peak] };
}

// ── Routes ──
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/live-attacks', async (req, res) => {
  try {
    const arcs = await fetchLiveAttacks();
    res.json(arcs);
  } catch (e) {
    console.error('AbuseIPDB error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/attacks', (req, res) => {
  res.json(generateHourlyData());
});

app.get('/api/news', async (req, res) => {
  try {
    res.json(await fetchNews());
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`CyberDashboard running at http://localhost:${PORT}`);
  fetchNews().catch(() => {});
  fetchLiveAttacks().catch(e => console.error('Initial attack fetch failed:', e.message));
});
