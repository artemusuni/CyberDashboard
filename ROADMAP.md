# CyberDashboard — Roadmap

> Last updated: 2026-04-17
> Status key: ✅ Done · 🔄 In Progress · ⬜ Planned · 🔥 High Priority

---

## MVP (Completed)

| Status | Feature |
|--------|---------|
| ✅ | Node.js + Express server |
| ✅ | Dark hacker theme — scanlines, neon glows, monospace font |
| ✅ | Boot sequence animation |
| ✅ | Live UTC clock in topbar |
| ✅ | Three-panel dashboard layout (news · chart · globe) |
| ✅ | Interactive 3D globe (Globe.gl) with attack arcs |
| ✅ | AbuseIPDB live attack data — top 100 high-confidence IPs |
| ✅ | Severity-coded arcs (critical / warning / info) |
| ✅ | Pulsing origin/destination rings on globe |
| ✅ | Hover tooltips on arcs |
| ✅ | Attack flash notifications on globe |
| ✅ | Chart.js attack frequency chart (24H) |
| ✅ | 24H / 7D / 30D chart range toggle |
| ✅ | Animated stat counters (today · week · peak hour) |
| ✅ | Live cyber news feed (The Hacker News, BleepingComputer, CISA) |
| ✅ | Auto-severity classification on news articles |
| ✅ | Clickable news cards opening source article |
| ✅ | Sound engine (boot chime, alert beeps, critical alarms) |
| ✅ | Sound toggle button |
| ✅ | Live total attack counter in topbar |
| ✅ | IP drill-down side panel (click arc → full AbuseIPDB report) |
| ✅ | SQLite historical attack storage |
| ✅ | Disk-based attack cache (2h TTL, survives restarts) |
| ✅ | IP report cache in SQLite (1h TTL) |
| ✅ | Multi-page navigation with collapsible sidebar |
| ✅ | Hash-based vanilla JS router |
| ✅ | Threat Map page — full-screen globe with severity filters |
| ✅ | Analytics page — 7D/30D charts, top countries, severity doughnut |
| ✅ | IP Lookup page — standalone AbuseIPDB search tool |
| ✅ | Settings page — data source status, feed config, display toggles |
| ✅ | Mobile responsive layout |

---

## Phase A — Stability & Deployability
*Goal: anyone can run this in 5 minutes*

| Status | Feature |
|--------|---------|
| ✅ | `.env.example` with all variables documented |
| ⬜ 🔥 | First-run setup wizard — redirect to config page if no API key |
| ⬜ 🔥 | `Dockerfile` + `docker-compose.yml` |
| ⬜ | Graceful error boundaries on all pages (no white screens) |
| ⬜ | Health check endpoint `/api/health` |
| ⬜ | README Docker setup instructions |

---

## Phase B — Multi-Source Threat Intelligence
*Goal: richer data than any single-source dashboard*

| Status | Feature |
|--------|---------|
| ⬜ | GreyNoise integration as second attack data source |
| ⬜ | Shodan internet-wide scan data |
| ⬜ | CVE feed from NVD API on news panel |
| ⬜ | MITRE ATT&CK tags on attacks |
| ⬜ | User-defined custom RSS feeds via Settings |
| ⬜ | Toggle between data sources on globe |

---

## Phase C — Real Usefulness
*Goal: give people a reason to actually run this*

| Status | Feature |
|--------|---------|
| ⬜ 🔥 | Monitor your own IPs — alert if they appear in attack feeds |
| ⬜ 🔥 | Webhook alerts — Discord / Slack / email on critical attacks |
| ⬜ | Weekly auto-generated threat report (PDF or email) |
| ⬜ | Custom watchlists — track specific countries, IPs, CVEs |
| ⬜ | Alert rules — e.g. "notify if China attacks spike 50% in 1 hour" |

---

## Phase D — Polish for Public Profile
*Goal: impressive at first glance*

| Status | Feature |
|--------|---------|
| ⬜ 🔥 | Landing/about page explaining the project with live demo link |
| ⬜ | Light/dark theme toggle |
| ⬜ | Keyboard shortcuts (G = globe, A = analytics, I = IP lookup, etc.) |
| ⬜ | Skeleton loading screens on all pages |
| ⬜ | Top attackers leaderboard on dashboard |
| ⬜ | Export attack history as CSV from Analytics |
| ⬜ | CVE lookup on IP Lookup page |
| ⬜ | Full mobile responsiveness on all new pages |

---

## Phase E — Open Source Release
*Goal: ready to share publicly*

| Status | Feature |
|--------|---------|
| ⬜ 🔥 | Live demo URL (Railway / Render / Fly.io) |
| ⬜ 🔥 | Demo GIF / video in README |
| ⬜ | API documentation (Swagger or plain markdown) |
| ⬜ | `CONTRIBUTING.md` |
| ⬜ | GitHub Actions CI (lint + basic tests on push) |
| ⬜ | GitHub repo topics: cybersecurity, dashboard, threat-intelligence, nodejs |
| ⬜ | Proper open source license (MIT) — already in README, confirm in repo |

---

## Icebox — Future Ideas

| Idea |
|------|
| Multi-tenant: organizations monitor their own IP ranges |
| User authentication + personal dashboards |
| Browser extension that flags known-malicious IPs on any webpage |
| API abuse monitoring — plug in your own server logs |
| Threat actor profiles with APT group associations |
| Mobile app (React Native) wrapping the dashboard |

---

## Build Order Recommendation

```
Phase A  →  Phase D  →  Phase C  →  Phase E  →  Phase B
(stable)    (polish)    (useful)    (release)   (more data)
```
