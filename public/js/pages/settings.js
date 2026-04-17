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
