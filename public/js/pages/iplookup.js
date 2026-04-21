import { errorScreen } from '../error.js';

const ABUSE_CATEGORIES = {
  1:'DNS Compromise', 2:'DNS Poisoning', 3:'Fraud Orders', 4:'DDoS Attack',
  5:'FTP Brute-Force', 6:'Ping of Death', 7:'Phishing', 8:'Fraud VoIP',
  9:'Open Proxy', 10:'Web Spam', 11:'Email Spam', 12:'Blog Spam',
  13:'VPN IP', 14:'Port Scan', 15:'Hacking', 16:'SQL Injection',
  17:'Spoofing', 18:'Brute-Force', 19:'Bad Web Bot', 20:'Exploited Host',
  21:'Web App Attack', 22:'SSH', 23:'IoT Targeted',
};

function ipSeverityClass(score) {
  if (score >= 95) return 'critical';
  if (score >= 70) return 'warning';
  return 'info';
}

function cveSeverityClass(sev) {
  const s = (sev || '').toUpperCase();
  if (s === 'CRITICAL') return 'critical';
  if (s === 'HIGH')     return 'warning';
  return 'info';
}

export function mountIpLookup(container) {
  try {
  container.innerHTML = `
    <div class="lookup-shell">
      <div class="lookup-header">
        <span class="page-title">[ IP &amp; CVE LOOKUP ]</span>
        <span class="page-sub">Query IPs against AbuseIPDB · Search CVEs via NVD</span>
      </div>

      <div class="lookup-tabs panel">
        <div class="panel-header">
          <div class="ltab-group" id="lookupTabGroup">
            <button class="ltab active" data-tab="ip">&#9900; IP LOOKUP</button>
            <button class="ltab" data-tab="cve">&#9900; CVE SEARCH</button>
          </div>
        </div>

        <div class="ltab-body" id="ltab-ip">
          <div class="lookup-input-row">
            <span class="lookup-prompt">&gt;&gt;</span>
            <input type="text" id="ipInput" class="lookup-input"
              placeholder="Enter IP address (e.g. 8.8.8.8)"
              spellcheck="false" autocomplete="off" />
            <button class="lookup-btn" id="lookupBtn">SCAN</button>
          </div>
          <div id="lookupError" class="lookup-error" hidden></div>
        </div>

        <div class="ltab-body" id="ltab-cve" hidden>
          <div class="lookup-input-row">
            <span class="lookup-prompt">&gt;&gt;</span>
            <input type="text" id="cveInput" class="lookup-input"
              placeholder="CVE ID or keyword (e.g. CVE-2021-44228, log4j)"
              spellcheck="false" autocomplete="off" />
            <button class="lookup-btn" id="cveBtn">SEARCH</button>
          </div>
          <div id="cveError" class="lookup-error" hidden></div>
        </div>
      </div>

      <div id="lookupResult" class="lookup-result"></div>
    </div>
  `;

  const resultEl = container.querySelector('#lookupResult');

  // ── Tab switching ──
  const ipInput  = container.querySelector('#ipInput');
  const cveInput = container.querySelector('#cveInput');
  container.querySelectorAll('.ltab').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.ltab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      container.querySelector('#ltab-ip').hidden  = tab !== 'ip';
      container.querySelector('#ltab-cve').hidden = tab !== 'cve';
      resultEl.innerHTML = '';
      window.Sounds?.click();
      setTimeout(() => (tab === 'ip' ? ipInput : cveInput).focus(), 50);
    });
  });

  // ── IP Lookup ──
  const btn     = container.querySelector('#lookupBtn');
  const errorEl = container.querySelector('#lookupError');

  setTimeout(() => ipInput.focus(), 100);

  async function doIpLookup() {
    const ip = ipInput.value.trim();
    if (!ip) return;
    errorEl.hidden = true;
    btn.textContent = 'SCANNING...';
    btn.disabled = true;
    resultEl.innerHTML = `<div class="ip-loading"><div class="ip-spinner"></div>QUERYING ABUSEIPDB FOR ${ip}...</div>`;
    window.Sounds?.click();
    try {
      const res = await fetch(`/api/ip/${encodeURIComponent(ip)}`);
      if (!res.ok) throw new Error((await res.json()).error || `HTTP ${res.status}`);
      renderIpResult(await res.json());
    } catch (e) {
      resultEl.innerHTML = '';
      errorEl.textContent = `ERROR: ${e.message}`;
      errorEl.hidden = false;
    } finally {
      btn.textContent = 'SCAN';
      btn.disabled = false;
    }
  }

  function renderIpResult(data) {
    const sc = data.abuseConfidenceScore;
    const sevClass = ipSeverityClass(sc);
    const cats    = [...new Set((data.reports ?? []).flatMap(r => r.categories))].slice(0, 10);
    const reports = (data.reports ?? []).slice(0, 8);
    resultEl.innerHTML = `
      <div class="panel lookup-report">
        <div class="panel-header">
          <span class="panel-title">[ REPORT: ${data.ipAddress} ]</span>
          <span class="news-tag ${sevClass}">${sevClass.toUpperCase()}</span>
        </div>
        <div class="lookup-report-body">
          <div class="ipr-score-row">
            <div class="ipr-score ${sevClass}">
              <span class="ipr-score-num">${sc}</span>
              <span class="ipr-score-label">ABUSE SCORE</span>
            </div>
            <div class="ipr-meta">
              <div class="ipr-ip">${data.ipAddress}</div>
              <div class="ipr-country">${data.countryName || '—'} (${data.countryCode || '—'})</div>
              <div class="ipr-isp">${data.isp || 'Unknown ISP'}</div>
              <div class="ipr-domain">${data.domain || '—'}</div>
            </div>
          </div>
          <div class="ipr-section">
            <div class="ipr-section-title">DETAILS</div>
            <div class="lookup-details-grid">
              <div class="ipr-kv"><span>USAGE TYPE</span><span>${data.usageType || '—'}</span></div>
              <div class="ipr-kv"><span>TOTAL REPORTS</span><span>${data.totalReports ?? 0}</span></div>
              <div class="ipr-kv"><span>DISTINCT USERS</span><span>${data.numDistinctUsers ?? 0}</span></div>
              <div class="ipr-kv"><span>LAST REPORTED</span><span>${data.lastReportedAt ? new Date(data.lastReportedAt).toLocaleDateString() : '—'}</span></div>
              <div class="ipr-kv"><span>IS TOR</span><span class="${data.isTor ? 'ipr-yes' : 'ipr-no'}">${data.isTor ? 'YES' : 'NO'}</span></div>
              <div class="ipr-kv"><span>IS PUBLIC</span><span>${data.isPublic ? 'YES' : 'NO'}</span></div>
              <div class="ipr-kv"><span>WHITELIST</span><span>${data.isWhitelisted ? 'YES' : 'NO'}</span></div>
              <div class="ipr-kv"><span>HOST NAMES</span><span>${(data.hostnames ?? []).join(', ') || '—'}</span></div>
            </div>
          </div>
          ${cats.length ? `
          <div class="ipr-section">
            <div class="ipr-section-title">ATTACK CATEGORIES</div>
            <div class="ipr-cats">${cats.map(c => `<span class="ipr-cat">${ABUSE_CATEGORIES[c] || 'Category ' + c}</span>`).join('')}</div>
          </div>` : ''}
          ${reports.length ? `
          <div class="ipr-section">
            <div class="ipr-section-title">RECENT REPORTS (${reports.length})</div>
            ${reports.map(r => `
              <div class="ipr-report">
                <span class="ipr-report-date">${new Date(r.reportedAt).toLocaleString()}</span>
                <span class="ipr-report-comment">${r.comment?.slice(0, 200) || 'No comment provided'}</span>
              </div>`).join('')}
          </div>` : ''}
        </div>
      </div>`;
  }

  btn.addEventListener('click', doIpLookup);
  ipInput.addEventListener('keydown', e => { if (e.key === 'Enter') doIpLookup(); });

  // ── CVE Search ──
  const cveBtn   = container.querySelector('#cveBtn');
  const cveError = container.querySelector('#cveError');

  async function doCveSearch() {
    const q = cveInput.value.trim();
    if (!q) return;
    cveError.hidden = true;
    cveBtn.textContent = 'SEARCHING...';
    cveBtn.disabled = true;
    resultEl.innerHTML = `<div class="ip-loading"><div class="ip-spinner"></div>QUERYING NVD FOR "${q}"...</div>`;
    window.Sounds?.click();
    try {
      const res = await fetch(`/api/cve/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error((await res.json()).error || `HTTP ${res.status}`);
      const data = await res.json();
      if (!data.length) throw new Error('No CVEs found');
      renderCveResults(data);
    } catch (e) {
      resultEl.innerHTML = '';
      cveError.textContent = `ERROR: ${e.message}`;
      cveError.hidden = false;
    } finally {
      cveBtn.textContent = 'SEARCH';
      cveBtn.disabled = false;
    }
  }

  function renderCveResults(list) {
    resultEl.innerHTML = list.map(cve => {
      const sevClass = cveSeverityClass(cve.severity);
      return `
        <div class="panel cve-card">
          <div class="panel-header">
            <span class="panel-title">[ ${cve.id} ]</span>
            <div class="cve-header-right">
              ${cve.score !== null ? `<span class="cve-score ${sevClass}">${cve.score}</span>` : ''}
              <span class="news-tag ${sevClass}">${(cve.severity || 'UNKNOWN').toUpperCase()}</span>
            </div>
          </div>
          <div class="cve-body">
            <p class="cve-desc">${cve.description || 'No description available.'}</p>
            <div class="lookup-details-grid">
              <div class="ipr-kv"><span>PUBLISHED</span><span>${cve.published ? new Date(cve.published).toLocaleDateString() : '—'}</span></div>
              <div class="ipr-kv"><span>MODIFIED</span><span>${cve.lastModified ? new Date(cve.lastModified).toLocaleDateString() : '—'}</span></div>
              ${cve.vector ? `<div class="ipr-kv"><span>VECTOR</span><span class="cve-vector">${cve.vector}</span></div>` : ''}
              ${cve.cwes?.length ? `<div class="ipr-kv"><span>CWE</span><span>${cve.cwes.join(', ')}</span></div>` : ''}
            </div>
            ${cve.refs?.length ? `
            <div class="ipr-section">
              <div class="ipr-section-title">REFERENCES</div>
              ${cve.refs.map(r => `
                <div class="cve-ref">
                  <a href="${r.url}" target="_blank" rel="noopener" class="cve-ref-link">${r.url}</a>
                  ${r.tags.length ? `<span class="cve-ref-tags">${r.tags.join(', ')}</span>` : ''}
                </div>`).join('')}
            </div>` : ''}
          </div>
        </div>`;
    }).join('');
  }

  cveBtn.addEventListener('click', doCveSearch);
  cveInput.addEventListener('keydown', e => { if (e.key === 'Enter') doCveSearch(); });
  } catch (e) {
    errorScreen(container, e.message, () => mountIpLookup(container));
  }
}

export function unmountIpLookup() {}
