const Database = require('better-sqlite3');
const path     = require('path');

const db = new Database(path.join(__dirname, 'cache', 'attacks.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS attack_events (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    ip        TEXT NOT NULL,
    country   TEXT,
    src_name  TEXT,
    dst_name  TEXT,
    severity  TEXT,
    score     INTEGER,
    reports   INTEGER,
    fetched_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_fetched_at ON attack_events(fetched_at);

  CREATE TABLE IF NOT EXISTS ip_cache (
    ip          TEXT PRIMARY KEY,
    data        TEXT NOT NULL,
    cached_at   INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS cve_cache (
    cve_id      TEXT PRIMARY KEY,
    data        TEXT NOT NULL,
    cached_at   INTEGER NOT NULL
  );
`);

const insertAttack = db.prepare(`
  INSERT INTO attack_events (ip, country, src_name, dst_name, severity, score, reports, fetched_at)
  VALUES (@ip, @country, @src_name, @dst_name, @severity, @score, @reports, @fetched_at)
`);

const insertMany = db.transaction(attacks => {
  for (const a of attacks) insertAttack.run(a);
});

function saveAttacks(arcs) {
  const now = Date.now();
  insertMany(arcs.map(a => ({
    ip:        a.ip,
    country:   a.srcName,
    src_name:  a.srcName,
    dst_name:  a.dstName,
    severity:  a.severity,
    score:     a.score,
    reports:   a.reports,
    fetched_at: now,
  })));
}

function getDailyStats() {
  // Last 24 hours, grouped by hour
  const since = Date.now() - 24 * 60 * 60 * 1000;
  return db.prepare(`
    SELECT
      strftime('%H:00', datetime(fetched_at/1000, 'unixepoch')) AS hour,
      COUNT(*) AS count
    FROM attack_events
    WHERE fetched_at >= ?
    GROUP BY hour
    ORDER BY hour
  `).all(since);
}

function getWeeklyStats() {
  const since = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return db.prepare(`
    SELECT
      strftime('%Y-%m-%d', datetime(fetched_at/1000, 'unixepoch')) AS day,
      COUNT(*) AS count
    FROM attack_events
    WHERE fetched_at >= ?
    GROUP BY day
    ORDER BY day
  `).all(since);
}

function getMonthlyStats() {
  const since = Date.now() - 30 * 24 * 60 * 60 * 1000;
  return db.prepare(`
    SELECT
      strftime('%Y-%m-%d', datetime(fetched_at/1000, 'unixepoch')) AS day,
      COUNT(*) AS count
    FROM attack_events
    WHERE fetched_at >= ?
    GROUP BY day
    ORDER BY day
  `).all(since);
}

function getTopCountries(limit = 10) {
  return db.prepare(`
    SELECT src_name AS country, COUNT(*) AS count
    FROM attack_events
    WHERE fetched_at >= ?
    GROUP BY src_name
    ORDER BY count DESC
    LIMIT ?
  `).all(Date.now() - 7 * 24 * 60 * 60 * 1000, limit);
}

function getCachedIp(ip) {
  const TTL = 60 * 60 * 1000; // 1 hour
  const row = db.prepare('SELECT data, cached_at FROM ip_cache WHERE ip = ?').get(ip);
  if (row && Date.now() - row.cached_at < TTL) return JSON.parse(row.data);
  return null;
}

function setCachedIp(ip, data) {
  db.prepare(`
    INSERT INTO ip_cache (ip, data, cached_at) VALUES (?, ?, ?)
    ON CONFLICT(ip) DO UPDATE SET data=excluded.data, cached_at=excluded.cached_at
  `).run(ip, JSON.stringify(data), Date.now());
}

function getCachedCve(cveId) {
  const TTL = 6 * 60 * 60 * 1000; // 6 hours
  const row = db.prepare('SELECT data, cached_at FROM cve_cache WHERE cve_id = ?').get(cveId);
  if (row && Date.now() - row.cached_at < TTL) return JSON.parse(row.data);
  return null;
}

function setCachedCve(cveId, data) {
  db.prepare(`
    INSERT INTO cve_cache (cve_id, data, cached_at) VALUES (?, ?, ?)
    ON CONFLICT(cve_id) DO UPDATE SET data=excluded.data, cached_at=excluded.cached_at
  `).run(cveId, JSON.stringify(data), Date.now());
}

module.exports = { saveAttacks, getDailyStats, getWeeklyStats, getMonthlyStats, getTopCountries, getCachedIp, setCachedIp, getCachedCve, setCachedCve };
