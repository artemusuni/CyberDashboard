require('dotenv').config();
const express = require('express');
const path    = require('path');
const fs      = require('fs');
const fetch   = require('node-fetch');
const Parser  = require('rss-parser');
const { saveAttacks, getDailyStats, getWeeklyStats, getMonthlyStats, getTopCountries, getCachedIp, setCachedIp, getCachedCve, setCachedCve } = require('./db');

const app    = express();
const PORT   = process.env.PORT || 3000;
const parser = new Parser({ timeout: 8000 });

// ── First-run check ──
function isConfigured() {
  return !!(process.env.ABUSEIPDB_KEY && process.env.ABUSEIPDB_KEY !== 'your_api_key_here');
}

app.use(express.json());

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

// ── AbuseIPDB live blacklist with file-based persistent cache ──
const ATTACK_CACHE_FILE = path.join(__dirname, 'cache', 'attacks.json');
const ATTACK_TTL        = 2 * 60 * 60 * 1000; // 2 hours

let attackMemCache = null; // in-memory for fast repeat requests

function readAttackFileCache() {
  try {
    const raw  = fs.readFileSync(ATTACK_CACHE_FILE, 'utf8');
    const { fetchedAt, arcs } = JSON.parse(raw);
    if (Date.now() - fetchedAt < ATTACK_TTL) return { fetchedAt, arcs };
  } catch {}
  return null;
}

function writeAttackFileCache(arcs) {
  try {
    fs.writeFileSync(ATTACK_CACHE_FILE, JSON.stringify({ fetchedAt: Date.now(), arcs }));
  } catch (e) {
    console.error('Failed to write attack cache:', e.message);
  }
}

async function fetchLiveAttacks() {
  // 1. Check in-memory cache first (avoids even disk reads on repeated requests)
  if (attackMemCache && Date.now() - attackMemCache.fetchedAt < ATTACK_TTL) {
    return attackMemCache.arcs;
  }

  // 2. Check disk cache
  const fileCached = readAttackFileCache();
  if (fileCached) {
    attackMemCache = fileCached;
    return fileCached.arcs;
  }

  // 3. Fetch fresh from AbuseIPDB
  const res = await fetch('https://api.abuseipdb.com/api/v2/blacklist?confidenceMinimum=90&limit=100', {
    headers: { Key: process.env.ABUSEIPDB_KEY, Accept: 'application/json' }
  });
  if (!res.ok) throw new Error(`AbuseIPDB ${res.status}`);

  const { data } = await res.json();
  const arcs = data
    .filter(ip => ip.countryCode && COUNTRY_COORDS[ip.countryCode])
    .slice(0, 40)
    .map(ip => {
      const src     = COUNTRY_COORDS[ip.countryCode];
      const dstCode = TARGETS.find(t => t !== ip.countryCode) ||
                      TARGETS[Math.floor(Math.random() * TARGETS.length)];
      const score   = ip.abuseConfidenceScore;
      return {
        srcLat: src.lat, srcLng: src.lng, srcName: src.name,
        dstLat: COUNTRY_COORDS[dstCode].lat, dstLng: COUNTRY_COORDS[dstCode].lng,
        dstName: COUNTRY_COORDS[dstCode].name,
        severity: score >= 95 ? 'critical' : score >= 85 ? 'warning' : 'info',
        score,
        ip: ip.ipAddress,
        reports: ip.totalReports,
      };
    });

  if (arcs.length > 0) {
    writeAttackFileCache(arcs);
    attackMemCache = { fetchedAt: Date.now(), arcs };
    saveAttacks(arcs);
  }

  return arcs.length > 0 ? arcs : (attackMemCache?.arcs ?? []);
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

// Redirect to setup if not configured
app.use((req, res, next) => {
  if (!isConfigured() && req.path !== '/setup.html' && !req.path.startsWith('/api/setup')) {
    return res.redirect('/setup.html');
  }
  next();
});

// ── Health check ──
app.get('/api/health', (req, res) => {
  res.json({
    status:      'ok',
    configured:  isConfigured(),
    uptime:      Math.floor(process.uptime()),
    timestamp:   new Date().toISOString(),
  });
});

// ── Setup wizard ──
app.post('/api/setup', (req, res) => {
  const { key } = req.body;
  if (!key || typeof key !== 'string' || key.trim().length < 20) {
    return res.status(400).json({ error: 'Invalid API key' });
  }

  const envPath    = path.join(__dirname, '.env');
  const envContent = `ABUSEIPDB_KEY=${key.trim()}\nPORT=${PORT}\n`;

  try {
    fs.writeFileSync(envPath, envContent);
    // Hot-reload the key so server doesn't need restart
    process.env.ABUSEIPDB_KEY = key.trim();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to write .env: ' + e.message });
  }
});

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

// ── IP detail drill-down ──
app.get('/api/ip/:ip', async (req, res) => {
  const ip = req.params.ip;

  // Basic IP validation
  if (!/^[\d.a-fA-F:]+$/.test(ip)) return res.status(400).json({ error: 'Invalid IP' });

  const cached = getCachedIp(ip);
  if (cached) return res.json(cached);

  try {
    const r = await fetch(
      `https://api.abuseipdb.com/api/v2/check?ipAddress=${encodeURIComponent(ip)}&maxAgeInDays=90&verbose`,
      { headers: { Key: process.env.ABUSEIPDB_KEY, Accept: 'application/json' } }
    );
    if (!r.ok) throw new Error(`AbuseIPDB ${r.status}`);
    const { data } = await r.json();
    setCachedIp(ip, data);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Historical stats ──
app.get('/api/history/:range', (req, res) => {
  try {
    const { range } = req.params;
    if (range === 'day')   return res.json(getDailyStats());
    if (range === 'week')  return res.json(getWeeklyStats());
    if (range === 'month') return res.json(getMonthlyStats());
    res.status(400).json({ error: 'Invalid range. Use day, week, or month.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Top attacker countries ──
app.get('/api/top-countries', (req, res) => {
  try {
    res.json(getTopCountries(10));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── CVE lookup (NVD API v2, no key required) ──
const NVD_BASE = 'https://services.nvd.nist.gov/rest/json/cves/2.0';

function parseCve(raw) {
  const cve     = raw.cve;
  const desc    = (cve.descriptions ?? []).find(d => d.lang === 'en')?.value ?? '';
  const metrics = cve.metrics ?? {};
  const cvss    = metrics.cvssMetricV31?.[0] ?? metrics.cvssMetricV30?.[0] ?? metrics.cvssMetricV2?.[0] ?? null;
  const score   = cvss?.cvssData?.baseScore ?? null;
  const severity= cvss?.cvssData?.baseSeverity ?? (score >= 9 ? 'CRITICAL' : score >= 7 ? 'HIGH' : score >= 4 ? 'MEDIUM' : 'LOW');
  const vector  = cvss?.cvssData?.vectorString ?? null;
  const cwes    = (cve.weaknesses ?? []).flatMap(w => w.description.map(d => d.value)).filter(v => v !== 'NVD-CWE-Other');
  const refs    = (cve.references ?? []).slice(0, 5).map(r => ({ url: r.url, tags: r.tags ?? [] }));
  return { id: cve.id, description: desc, score, severity, vector, cwes, refs, published: cve.published, lastModified: cve.lastModified };
}

app.get('/api/cve/search', async (req, res) => {
  const q = (req.query.q || '').trim().slice(0, 100);
  if (!q) return res.status(400).json({ error: 'Missing query' });
  try {
    const isCveId = /^CVE-\d{4}-\d+$/i.test(q);
    const url = isCveId
      ? `${NVD_BASE}?cveId=${encodeURIComponent(q.toUpperCase())}`
      : `${NVD_BASE}?keywordSearch=${encodeURIComponent(q)}&resultsPerPage=10`;
    const r = await fetch(url, { headers: { 'User-Agent': 'CyberDashboard/1.0' } });
    if (!r.ok) throw new Error(`NVD API ${r.status}`);
    const { vulnerabilities = [] } = await r.json();
    res.json(vulnerabilities.map(parseCve));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/cve/:id', async (req, res) => {
  const id = req.params.id.toUpperCase();
  if (!/^CVE-\d{4}-\d+$/.test(id)) return res.status(400).json({ error: 'Invalid CVE ID' });

  const cached = getCachedCve(id);
  if (cached) return res.json(cached);

  try {
    const r = await fetch(`${NVD_BASE}?cveId=${encodeURIComponent(id)}`, { headers: { 'User-Agent': 'CyberDashboard/1.0' } });
    if (!r.ok) throw new Error(`NVD API ${r.status}`);
    const { vulnerabilities = [] } = await r.json();
    if (!vulnerabilities.length) return res.status(404).json({ error: 'CVE not found' });
    const parsed = parseCve(vulnerabilities[0]);
    setCachedCve(id, parsed);
    res.json(parsed);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    configured: isConfigured(),
    uptime: Math.floor(process.uptime()),
    version: '1.0.0',
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`CyberDashboard running at http://localhost:${PORT}`);
  fetchNews().catch(() => {});
  fetchLiveAttacks().catch(e => console.error('Initial attack fetch failed:', e.message));
});
