export function mountSettings(container) {
  container.innerHTML = `
    <div class="settings-shell">
      <div class="settings-header">
        <span class="page-title">[ SETTINGS ]</span>
        <span class="page-sub">Dashboard configuration</span>
      </div>

      <div class="settings-grid">

        <div class="panel settings-panel">
          <div class="panel-header"><span class="panel-title">[ DATA SOURCES ]</span></div>
          <div class="settings-body">
            <div class="setting-row">
              <div class="setting-info">
                <span class="setting-name">AbuseIPDB API</span>
                <span class="setting-desc">Live attack data source. Free tier: 1,000 checks/day.</span>
              </div>
              <span class="setting-status ok">CONNECTED</span>
            </div>
            <div class="setting-row">
              <div class="setting-info">
                <span class="setting-name">Attack Cache TTL</span>
                <span class="setting-desc">How long attack data is cached before re-fetching.</span>
              </div>
              <span class="setting-value">2 HOURS</span>
            </div>
            <div class="setting-row">
              <div class="setting-info">
                <span class="setting-name">IP Report Cache TTL</span>
                <span class="setting-desc">How long individual IP reports are cached.</span>
              </div>
              <span class="setting-value">1 HOUR</span>
            </div>
          </div>
        </div>

        <div class="panel settings-panel">
          <div class="panel-header"><span class="panel-title">[ NEWS FEEDS ]</span></div>
          <div class="settings-body">
            ${[
              ['The Hacker News', 'feeds.feedburner.com/TheHackersNews'],
              ['BleepingComputer', 'bleepingcomputer.com/feed'],
              ['CISA Advisories', 'cisa.gov/cybersecurity-advisories'],
            ].map(([name, url]) => `
              <div class="setting-row">
                <div class="setting-info">
                  <span class="setting-name">${name}</span>
                  <span class="setting-desc">${url}</span>
                </div>
                <span class="setting-status ok">ACTIVE</span>
              </div>
            `).join('')}
            <div class="setting-row">
              <div class="setting-info">
                <span class="setting-name">Refresh Interval</span>
                <span class="setting-desc">How often news is fetched from RSS sources.</span>
              </div>
              <span class="setting-value">5 MIN</span>
            </div>
          </div>
        </div>

        <div class="panel settings-panel" id="customFeedsPanel">
          <div class="panel-header"><span class="panel-title">[ CUSTOM RSS FEEDS ]</span></div>
          <div class="settings-body">
            <div class="setting-row">
              <div class="setting-info">
                <span class="setting-name">Add Feed</span>
                <span class="setting-desc">Paste any RSS/Atom feed URL. Articles appear in the news panel.</span>
              </div>
            </div>
            <div class="setting-row setting-row-col">
              <div style="display:flex;gap:8px;width:100%;">
                <input type="text" class="setting-input" id="feedName" placeholder="Label (optional)" spellcheck="false" style="flex:0 0 140px;" />
                <input type="text" class="setting-input" id="feedUrl" placeholder="https://example.com/feed.xml" spellcheck="false" style="flex:1;" />
                <button class="setting-toggle" id="feedAdd">ADD</button>
              </div>
            </div>
            <div id="customFeedItems" class="watchlist-items"></div>
            <div id="feedStatus" class="setting-desc" style="margin-top:6px;"></div>
          </div>
        </div>

        <div class="panel settings-panel">
          <div class="panel-header"><span class="panel-title">[ DISPLAY ]</span></div>
          <div class="settings-body">
            <div class="setting-row">
              <div class="setting-info">
                <span class="setting-name">Sound Effects</span>
                <span class="setting-desc">Toggle attack alerts and UI sounds.</span>
              </div>
              <button class="setting-toggle" id="settingSoundToggle">OFF</button>
            </div>
            <div class="setting-row">
              <div class="setting-info">
                <span class="setting-name">High Contrast Mode</span>
                <span class="setting-desc">Stronger borders and brighter text for low-vision users.</span>
              </div>
              <button class="setting-toggle" id="hcToggle" aria-pressed="false">OFF</button>
            </div>
            <div class="setting-row">
              <div class="setting-info">
                <span class="setting-name">Visual Flash Alerts</span>
                <span class="setting-desc">Screen border flash on attacks — useful if sound is off (off by default).</span>
              </div>
              <button class="setting-toggle" id="flashToggle" aria-pressed="false">OFF</button>
            </div>
            <div class="setting-row">
              <div class="setting-info">
                <span class="setting-name">Globe Auto-Rotate</span>
                <span class="setting-desc">Automatically rotate the 3D globe.</span>
              </div>
              <span class="setting-value">ON</span>
            </div>
            <div class="setting-row">
              <div class="setting-info">
                <span class="setting-name">Attack Flash Notifications</span>
                <span class="setting-desc">Show flash alerts for critical attacks on globe.</span>
              </div>
              <span class="setting-value">ON</span>
            </div>
          </div>
        </div>

        <div class="panel settings-panel" id="webhookPanel">
          <div class="panel-header"><span class="panel-title">[ WEBHOOK ALERTS ]</span></div>
          <div class="settings-body">
            <div class="setting-row">
              <div class="setting-info">
                <span class="setting-name">Alert Threshold</span>
                <span class="setting-desc">Minimum severity level to trigger an alert.</span>
              </div>
              <select class="setting-select" id="webhookThreshold">
                <option value="critical">CRITICAL ONLY</option>
                <option value="warning">WARNING + CRITICAL</option>
              </select>
            </div>
            <div class="setting-row setting-row-col">
              <div class="setting-info">
                <span class="setting-name">Discord Webhook URL</span>
                <span class="setting-desc">Paste your Discord channel webhook URL.</span>
              </div>
              <input type="text" class="setting-input" id="discordUrl" placeholder="https://discord.com/api/webhooks/..." spellcheck="false" />
            </div>
            <div class="setting-row setting-row-col">
              <div class="setting-info">
                <span class="setting-name">Slack Webhook URL</span>
                <span class="setting-desc">Paste your Slack incoming webhook URL.</span>
              </div>
              <input type="text" class="setting-input" id="slackUrl" placeholder="https://hooks.slack.com/services/..." spellcheck="false" />
            </div>
            <div class="setting-row">
              <div id="webhookStatus" class="setting-desc"></div>
              <div style="display:flex;gap:8px;">
                <button class="setting-toggle" id="webhookSave">SAVE</button>
                <button class="setting-toggle" id="webhookTest">TEST</button>
              </div>
            </div>
          </div>
        </div>

        <div class="panel settings-panel" id="watchlistPanel">
          <div class="panel-header"><span class="panel-title">[ IP WATCHLIST ]</span></div>
          <div class="settings-body">
            <div class="setting-row">
              <div class="setting-info">
                <span class="setting-name">Monitor IPs</span>
                <span class="setting-desc">Get alerted when these IPs appear in the live attack feed.</span>
              </div>
            </div>
            <div class="setting-row setting-row-col">
              <div style="display:flex;gap:8px;width:100%;">
                <input type="text" class="setting-input" id="watchlistInput" placeholder="e.g. 192.168.1.1" spellcheck="false" style="flex:1;" />
                <button class="setting-toggle" id="watchlistAdd">ADD</button>
              </div>
            </div>
            <div id="watchlistItems" class="watchlist-items"></div>
            <div id="watchlistStatus" class="setting-desc" style="margin-top:6px;"></div>
          </div>
        </div>

        <div class="panel settings-panel">
          <div class="panel-header"><span class="panel-title">[ DATABASE ]</span></div>
          <div class="settings-body">
            <div class="setting-row">
              <div class="setting-info">
                <span class="setting-name">Storage Location</span>
                <span class="setting-desc">Local SQLite database path.</span>
              </div>
              <span class="setting-value">cache/attacks.db</span>
            </div>
            <div class="setting-row">
              <div class="setting-info">
                <span class="setting-name">Historical Data</span>
                <span class="setting-desc">Attack events are stored and power 7D/30D charts.</span>
              </div>
              <span class="setting-status ok">ACTIVE</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  `;

  // ── Webhook panel ──
  async function loadWebhooks() {
    try {
      const res = await fetch('/api/settings/webhooks');
      const cfg = await res.json();
      container.querySelector('#discordUrl').value   = cfg.discord   || '';
      container.querySelector('#slackUrl').value     = cfg.slack     || '';
      container.querySelector('#webhookThreshold').value = cfg.threshold || 'critical';
    } catch {}
  }

  function setWebhookStatus(msg, ok) {
    const el = container.querySelector('#webhookStatus');
    el.textContent = msg;
    el.style.color = ok ? 'var(--green)' : 'var(--red)';
  }

  container.querySelector('#webhookSave').addEventListener('click', async () => {
    const discord   = container.querySelector('#discordUrl').value.trim();
    const slack     = container.querySelector('#slackUrl').value.trim();
    const threshold = container.querySelector('#webhookThreshold').value;
    try {
      const res = await fetch('/api/settings/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discord, slack, threshold }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setWebhookStatus('SAVED', true);
      window.Sounds?.click();
    } catch (e) { setWebhookStatus(`ERROR: ${e.message}`, false); }
  });

  container.querySelector('#webhookTest').addEventListener('click', async () => {
    setWebhookStatus('SENDING TEST...', true);
    try {
      const res = await fetch('/api/settings/webhooks/test', { method: 'POST' });
      if (!res.ok) throw new Error((await res.json()).error);
      setWebhookStatus('TEST SENT — CHECK YOUR CHANNEL', true);
      window.Sounds?.click();
    } catch (e) { setWebhookStatus(`ERROR: ${e.message}`, false); }
  });

  loadWebhooks();

  // Sync sound toggle with actual state
  const soundBtn = container.querySelector('#settingSoundToggle');
  const mainSoundBtn = document.getElementById('soundToggle');

  function syncSound() {
    const isOn = mainSoundBtn?.classList.contains('sound-on');
    soundBtn.textContent = isOn ? 'ON' : 'OFF';
    soundBtn.classList.toggle('active', isOn);
  }
  syncSound();

  soundBtn.addEventListener('click', () => {
    document.getElementById('soundToggle')?.click();
    setTimeout(syncSound, 50);
  });

  // ── Visual flash toggle ──
  const flashBtn = container.querySelector('#flashToggle');
  function syncFlash() {
    const on = window.FlashAlerts?.enabled ?? false;
    flashBtn.textContent = on ? 'ON' : 'OFF';
    flashBtn.classList.toggle('active', on);
    flashBtn.setAttribute('aria-pressed', String(on));
  }
  syncFlash();

  flashBtn.addEventListener('click', () => {
    if (window.FlashAlerts) window.FlashAlerts.enabled = !window.FlashAlerts.enabled;
    syncFlash();
    window.Sounds?.click();
  });

  // ── Watchlist panel ──
  function setWatchlistStatus(msg, ok) {
    const el = container.querySelector('#watchlistStatus');
    el.textContent = msg;
    el.style.color = ok ? 'var(--green)' : 'var(--red)';
  }

  function renderWatchlist(list) {
    const el = container.querySelector('#watchlistItems');
    if (!list.length) {
      el.innerHTML = '<div class="watchlist-empty">No IPs monitored</div>';
      return;
    }
    el.innerHTML = list.map(ip => `
      <div class="watchlist-item">
        <span class="watchlist-ip">${ip}</span>
        <button class="watchlist-remove" data-ip="${ip}">✕</button>
      </div>
    `).join('');
    el.querySelectorAll('.watchlist-remove').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          const res = await fetch(`/api/watchlist/${encodeURIComponent(btn.dataset.ip)}`, { method: 'DELETE' });
          const data = await res.json();
          renderWatchlist(data.list);
          window.Sounds?.click();
        } catch { setWatchlistStatus('ERROR removing IP', false); }
      });
    });
  }

  async function loadWatchlist() {
    try {
      const res = await fetch('/api/watchlist');
      renderWatchlist(await res.json());
    } catch { setWatchlistStatus('ERROR loading watchlist', false); }
  }

  container.querySelector('#watchlistAdd').addEventListener('click', async () => {
    const ip = container.querySelector('#watchlistInput').value.trim();
    if (!ip) return;
    try {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const data = await res.json();
      renderWatchlist(data.list);
      container.querySelector('#watchlistInput').value = '';
      setWatchlistStatus(`${ip} added to watchlist`, true);
      window.Sounds?.click();
    } catch (e) { setWatchlistStatus(`ERROR: ${e.message}`, false); }
  });

  container.querySelector('#watchlistInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') container.querySelector('#watchlistAdd').click();
  });

  loadWatchlist();

  // ── Custom RSS feeds panel ──
  function setFeedStatus(msg, ok) {
    const el = container.querySelector('#feedStatus');
    el.textContent = msg;
    el.style.color = ok ? 'var(--green)' : 'var(--red)';
  }

  function renderCustomFeeds(list) {
    const el = container.querySelector('#customFeedItems');
    if (!list.length) {
      el.innerHTML = '<div class="watchlist-empty">No custom feeds added</div>';
      return;
    }
    el.innerHTML = list.map((f, i) => `
      <div class="watchlist-item">
        <div style="display:flex;flex-direction:column;gap:2px;overflow:hidden;">
          <span class="watchlist-ip">${f.name}</span>
          <span class="setting-desc" style="font-size:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${f.url}</span>
        </div>
        <button class="watchlist-remove" data-idx="${i}">✕</button>
      </div>
    `).join('');
    el.querySelectorAll('.watchlist-remove').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          const res = await fetch(`/api/feeds/${btn.dataset.idx}`, { method: 'DELETE' });
          const data = await res.json();
          renderCustomFeeds(data.list);
          window.Sounds?.click();
        } catch { setFeedStatus('ERROR removing feed', false); }
      });
    });
  }

  async function loadCustomFeeds() {
    try {
      const res = await fetch('/api/feeds');
      renderCustomFeeds(await res.json());
    } catch { setFeedStatus('ERROR loading feeds', false); }
  }

  container.querySelector('#feedAdd').addEventListener('click', async () => {
    const url  = container.querySelector('#feedUrl').value.trim();
    const name = container.querySelector('#feedName').value.trim();
    if (!url) return;
    try {
      const res = await fetch('/api/feeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, name }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const data = await res.json();
      renderCustomFeeds(data.list);
      container.querySelector('#feedUrl').value  = '';
      container.querySelector('#feedName').value = '';
      setFeedStatus('Feed added — articles will appear in the news panel within 5 min', true);
      window.Sounds?.click();
    } catch (e) { setFeedStatus(`ERROR: ${e.message}`, false); }
  });

  container.querySelector('#feedUrl').addEventListener('keydown', e => {
    if (e.key === 'Enter') container.querySelector('#feedAdd').click();
  });

  loadCustomFeeds();

  // ── High-Contrast toggle ──
  const hcBtn = container.querySelector('#hcToggle');
  function syncHC() {
    const on = document.documentElement.classList.contains('high-contrast');
    hcBtn.textContent = on ? 'ON' : 'OFF';
    hcBtn.classList.toggle('active', on);
    hcBtn.setAttribute('aria-pressed', String(on));
  }
  syncHC();

  hcBtn.addEventListener('click', () => {
    const on = document.documentElement.classList.toggle('high-contrast');
    localStorage.setItem('highContrast', on);
    syncHC();
    window.Sounds?.click();
  });
}
