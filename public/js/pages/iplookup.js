import { errorScreen } from '../error.js';

const ABUSE_CATEGORIES = {
  1:'DNS Compromise', 2:'DNS Poisoning', 3:'Fraud Orders', 4:'DDoS Attack',
  5:'FTP Brute-Force', 6:'Ping of Death', 7:'Phishing', 8:'Fraud VoIP',
  9:'Open Proxy', 10:'Web Spam', 11:'Email Spam', 12:'Blog Spam',
  13:'VPN IP', 14:'Port Scan', 15:'Hacking', 16:'SQL Injection',
  17:'Spoofing', 18:'Brute-Force', 19:'Bad Web Bot', 20:'Exploited Host',
  21:'Web App Attack', 22:'SSH', 23:'IoT Targeted',
};

function severityClass(score) {
  if (score >= 95) return 'critical';
  if (score >= 70) return 'warning';
  return 'info';
}

export function mountIpLookup(container) {
  try {
  container.innerHTML = `
    <div class="lookup-shell">
      <div class="lookup-header">
        <span class="page-title">[ IP LOOKUP ]</span>
        <span class="page-sub">Query any IP address against AbuseIPDB</span>
      </div>

      <div class="lookup-form panel">
        <div class="panel-header">
          <span class="panel-title">[ ENTER TARGET ]</span>
        </div>
        <div class="lookup-input-row">
          <span class="lookup-prompt">&gt;&gt;</span>
          <input
            type="text"
            id="ipInput"
            class="lookup-input"
            placeholder="Enter IP address (e.g. 192.168.1.1)"
            spellcheck="false"
            autocomplete="off"
          />
          <button class="lookup-btn" id="lookupBtn">SCAN</button>
        </div>
        <div id="lookupError" class="lookup-error" hidden></div>
      </div>

      <div id="lookupResult" class="lookup-result"></div>
    </div>
  `;

  const input     = container.querySelector('#ipInput');
  const btn       = container.querySelector('#lookupBtn');
  const errorEl   = container.querySelector('#lookupError');
  const resultEl  = container.querySelector('#lookupResult');

  // Focus input on mount
  setTimeout(() => input.focus(), 100);

  async function doLookup() {
    const ip = input.value.trim();
    if (!ip) return;

    errorEl.hidden = true;
    btn.textContent = 'SCANNING...';
    btn.disabled    = true;
    resultEl.innerHTML = `<div class="ip-loading"><div class="ip-spinner"></div>QUERYING ABUSEIPDB FOR ${ip}...</div>`;
    window.Sounds?.click();

    try {
      const res = await fetch(`/api/ip/${encodeURIComponent(ip)}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      renderResult(data);
    } catch (e) {
      resultEl.innerHTML = '';
      errorEl.textContent = `ERROR: ${e.message}`;
      errorEl.hidden = false;
    } finally {
      btn.textContent = 'SCAN';
      btn.disabled    = false;
    }
  }

  function renderResult(data) {
    const sc       = data.abuseConfidenceScore;
    const sevClass = severityClass(sc);
    const cats     = [...new Set((data.reports ?? []).flatMap(r => r.categories))].slice(0, 10);
    const reports  = (data.reports ?? []).slice(0, 8);

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
              <div class="ipr-kv"><span>VERSION</span><span>${data.isWhitelisted ? 'WHITELISTED' : 'NOT WHITELISTED'}</span></div>
              <div class="ipr-kv"><span>HOST NAMES</span><span>${(data.hostnames ?? []).join(', ') || '—'}</span></div>
            </div>
          </div>

          ${cats.length > 0 ? `
          <div class="ipr-section">
            <div class="ipr-section-title">ATTACK CATEGORIES</div>
            <div class="ipr-cats">
              ${cats.map(c => `<span class="ipr-cat">${ABUSE_CATEGORIES[c] || 'Category ' + c}</span>`).join('')}
            </div>
          </div>` : ''}

          ${reports.length > 0 ? `
          <div class="ipr-section">
            <div class="ipr-section-title">RECENT REPORTS (${reports.length})</div>
            ${reports.map(r => `
              <div class="ipr-report">
                <span class="ipr-report-date">${new Date(r.reportedAt).toLocaleString()}</span>
                <span class="ipr-report-comment">${r.comment?.slice(0, 200) || 'No comment provided'}</span>
              </div>
            `).join('')}
          </div>` : ''}

        </div>
      </div>
    `;
  }

  btn.addEventListener('click', doLookup);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') doLookup(); });
  } catch (e) {
    errorScreen(container, e.message, () => mountIpLookup(container));
  }
}

export function unmountIpLookup() {}
