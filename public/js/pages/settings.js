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
}
