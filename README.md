# >> CYBER**DASHBOARD**

> A real-time cybersecurity monitoring dashboard with live threat intelligence, attack frequency charts, an interactive 3D global attack map, and webhook alerts.

![Preview](docs/preview.png)
<!-- Replace docs/preview.png with a screenshot of your dashboard -->

---

## Features

- **Live Threat Intelligence Feed** — pulls real articles from The Hacker News, BleepingComputer, and CISA. Auto-classifies severity (CRITICAL / WARNING / INFO) by keyword analysis. Refreshes every 5 minutes.
- **Interactive 3D Globe** — real-time attack arcs sourced from AbuseIPDB's blacklist. Color-coded by severity. Drag to rotate, scroll to zoom.
- **IP Drill-Down Panel** — click any attack arc to open a full AbuseIPDB report: abuse score, ISP, domain, TOR status, attack categories, and recent report comments.
- **Attack Frequency Chart** — neon Chart.js bar chart with 24H / 7D / 30D toggle. Historical data stored in SQLite and accumulates over time.
- **Analytics Page** — 7D/30D trend charts, top attacker countries, severity breakdown doughnut, CSV export.
- **IP Lookup & CVE Search** — standalone AbuseIPDB IP lookup and NVD CVE search in one place.
- **Webhook Alerts** — get pinged on Discord or Slack when critical attacks are detected.
- **IP Watchlist** — monitor your own IPs; receive an alert the moment one appears in the attack feed.
- **Boot Sequence Animation** — terminal-style system initialization on every load.
- **Sound Engine** — toggleable Web Audio alerts: boot chime, critical attack alarms, news alerts.
- **Dark Hacker Theme** — scanline overlay, neon glow effects, monospace font, pulsing LIVE badges.
- **Keyboard Shortcuts** — `D` / `T` / `A` / `I` / `S` navigate between pages instantly.
- **Mobile Responsive** — stacks to single column on small screens.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Server | Node.js + Express |
| Database | SQLite via better-sqlite3 |
| Globe | Globe.gl + Three.js |
| Chart | Chart.js |
| News | rss-parser + node-fetch |
| Threat Data | AbuseIPDB API |
| CVE Data | NVD API v2 (no key required) |
| Font | Share Tech Mono (Google Fonts) |

---

## Quick Start — Docker (recommended)

The fastest way to run CyberDashboard. Requires [Docker](https://docs.docker.com/get-docker/) and a free [AbuseIPDB API key](https://www.abuseipdb.com/register).

```bash
# 1. Clone the repo
git clone https://github.com/artemusuni/CyberDashboard.git
cd CyberDashboard

# 2. Create your environment file
cp .env.example .env
```

Open `.env` and add your key:

```env
ABUSEIPDB_KEY=your_api_key_here
```

```bash
# 3. Build and start
docker compose up -d
```

Open [http://localhost:3000](http://localhost:3000) — done.

**To stop:**
```bash
docker compose down
```

**To view logs:**
```bash
docker compose logs -f
```

**To update after pulling new changes:**
```bash
docker compose down
docker compose up -d --build
```

> Attack history and settings are persisted in a named Docker volume (`cache`) so data survives container restarts and rebuilds.

---

## Quick Start — Local (Node.js)

### Prerequisites

- Node.js 18+
- A free [AbuseIPDB](https://www.abuseipdb.com/register) API key

### Installation

```bash
git clone https://github.com/artemusuni/CyberDashboard.git
cd CyberDashboard
npm install
```

### Configuration

```bash
cp .env.example .env
# Edit .env and add your AbuseIPDB key
```

### Run

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000).

> **First run:** if no API key is configured, the dashboard will redirect you to a setup wizard automatically.

---

## Configuration

All configuration lives in `.env`:

```env
# Required — get a free key at https://www.abuseipdb.com/register
ABUSEIPDB_KEY=your_api_key_here

# Optional — defaults to 3000
PORT=3000
```

Webhook URLs (Discord / Slack) and the IP watchlist are configured through the **Settings** page in the UI and stored in `cache/` automatically.

---

## Data & Caching

| Source | Storage | TTL |
|---|---|---|
| AbuseIPDB blacklist | `cache/attacks.json` + SQLite | 2 hours |
| IP drill-down reports | SQLite `ip_cache` table | 1 hour |
| CVE lookups | SQLite `cve_cache` table | 24 hours |
| RSS news feeds | In-memory | 5 minutes |
| Webhook config | `cache/webhook.json` | Permanent |
| IP watchlist | `cache/watchlist.json` | Permanent |

Attack data accumulates in SQLite over time, powering the 7D and 30D historical chart views.

---

## Project Structure

```
CyberDashboard/
├── server.js              # Express server + all API routes
├── db.js                  # SQLite schema, queries, caching helpers
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── public/
│   ├── index.html         # Main dashboard shell
│   ├── landing.html       # Public landing page
│   ├── css/
│   │   └── style.css      # Dark hacker theme
│   └── js/
│       ├── boot.js        # Boot sequence animation
│       ├── sound.js       # Web Audio sound engine
│       ├── main.js        # Clock, nav, leaderboard
│       ├── router.js      # Hash-based client-side router
│       ├── globe.js       # 3D globe + IP panel
│       └── pages/         # Per-page modules
│           ├── dashboard.js
│           ├── threatmap.js
│           ├── analytics.js
│           ├── iplookup.js
│           └── settings.js
└── cache/                 # Auto-generated, gitignored
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Server health check |
| GET | `/api/live-attacks` | Top 100 malicious IPs from AbuseIPDB, mapped to arcs |
| GET | `/api/ip/:ip` | Full AbuseIPDB report for a specific IP |
| GET | `/api/attacks` | Hourly attack frequency for today |
| GET | `/api/history/:range` | Historical stats — `day`, `week`, or `month` |
| GET | `/api/news` | Latest articles from threat intelligence RSS feeds |
| GET | `/api/top-countries` | Top 10 attacker countries (last 7 days) |
| GET | `/api/cve/search?q=` | Search CVEs by keyword via NVD API |
| GET | `/api/cve/:id` | Fetch a specific CVE by ID (e.g. `CVE-2024-1234`) |
| GET | `/api/watchlist` | Get monitored IPs |
| POST | `/api/watchlist` | Add an IP to the watchlist |
| DELETE | `/api/watchlist/:ip` | Remove an IP from the watchlist |
| GET | `/api/settings/webhooks` | Get current webhook configuration |
| POST | `/api/settings/webhooks` | Save Discord/Slack webhook URLs + threshold |
| POST | `/api/settings/webhooks/test` | Send a test alert to configured webhooks |

---

## License

MIT
