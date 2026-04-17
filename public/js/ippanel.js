const panel        = document.getElementById('ipPanel');
const panelBody    = document.getElementById('ipPanelBody');
const panelOverlay = document.getElementById('ipPanelOverlay');
const panelClose   = document.getElementById('ipPanelClose');

const ABUSE_CATEGORIES = {
  1:'DNS Compromise', 2:'DNS Poisoning', 3:'Fraud Orders', 4:'DDoS Attack',
  5:'FTP Brute-Force', 6:'Ping of Death', 7:'Phishing', 8:'Fraud VoIP',
  9:'Open Proxy', 10:'Web Spam', 11:'Email Spam', 12:'Blog Spam',
  13:'VPN IP', 14:'Port Scan', 15:'Hacking', 16:'SQL Injection',
  17:'Spoofing', 18:'Brute-Force', 19:'Bad Web Bot', 20:'Exploited Host',
  21:'Web App Attack', 22:'SSH', 23:'IoT Targeted',
};

function openPanel() {
  panel.classList.add('open');
  panelOverlay.classList.add('open');
}

function closePanel() {
  panel.classList.remove('open');
  panelOverlay.classList.remove('open');
}

panelClose.addEventListener('click', closePanel);
panelOverlay.addEventListener('click', closePanel);

document.addEventListener('keydown', e => { if (e.key === 'Escape') closePanel(); });

function severityClass(score) {
  if (score >= 95) return 'critical';
  if (score >= 70) return 'warning';
  return 'info';
}

export async function showIpReport(ip, srcName, dstName, severity) {
  panelBody.innerHTML = `<div class="ip-loading"><div class="ip-spinner"></div>FETCHING REPORT FOR ${ip}...</div>`;
  openPanel();

  try {
    const res  = await fetch(`/api/ip/${encodeURIComponent(ip)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const sc    = data.abuseConfidenceScore;
    const cats  = (data.reports?.flatMap(r => r.categories) ?? []);
    const uniqCats = [...new Set(cats)].slice(0, 8);
    const lastReports = (data.reports ?? []).slice(0, 5);

    panelBody.innerHTML = `
      <div class="ipr-score-row">
        <div class="ipr-score ${severityClass(sc)}">
          <span class="ipr-score-num">${sc}</span>
          <span class="ipr-score-label">ABUSE SCORE</span>
        </div>
        <div class="ipr-meta">
          <div class="ipr-ip">${data.ipAddress}</div>
          <div class="ipr-country">${data.countryName || srcName} &rarr; ${dstName}</div>
          <div class="ipr-isp">${data.isp || 'Unknown ISP'}</div>
          <div class="ipr-domain">${data.domain || '—'}</div>
        </div>
      </div>

      <div class="ipr-section">
        <div class="ipr-section-title">DETAILS</div>
        <div class="ipr-grid">
          <div class="ipr-kv"><span>USAGE TYPE</span><span>${data.usageType || '—'}</span></div>
          <div class="ipr-kv"><span>TOTAL REPORTS</span><span>${data.totalReports ?? 0}</span></div>
          <div class="ipr-kv"><span>DISTINCT USERS</span><span>${data.numDistinctUsers ?? 0}</span></div>
          <div class="ipr-kv"><span>LAST REPORTED</span><span>${data.lastReportedAt ? new Date(data.lastReportedAt).toLocaleDateString() : '—'}</span></div>
          <div class="ipr-kv"><span>IS TOR</span><span class="${data.isTor ? 'ipr-yes' : 'ipr-no'}">${data.isTor ? 'YES' : 'NO'}</span></div>
          <div class="ipr-kv"><span>IS PUBLIC</span><span>${data.isPublic ? 'YES' : 'NO'}</span></div>
        </div>
      </div>

      ${uniqCats.length > 0 ? `
      <div class="ipr-section">
        <div class="ipr-section-title">ATTACK CATEGORIES</div>
        <div class="ipr-cats">
          ${uniqCats.map(c => `<span class="ipr-cat">${ABUSE_CATEGORIES[c] || 'Category '+c}</span>`).join('')}
        </div>
      </div>` : ''}

      ${lastReports.length > 0 ? `
      <div class="ipr-section">
        <div class="ipr-section-title">RECENT REPORTS</div>
        ${lastReports.map(r => `
          <div class="ipr-report">
            <span class="ipr-report-date">${new Date(r.reportedAt).toLocaleString()}</span>
            <span class="ipr-report-comment">${r.comment?.slice(0, 120) || 'No comment'}</span>
          </div>
        `).join('')}
      </div>` : ''}
    `;
  } catch (e) {
    panelBody.innerHTML = `
      <div class="ip-error">
        <span class="news-tag critical">ERROR</span>
        <p>Failed to fetch report for ${ip}</p>
        <p>${e.message}</p>
      </div>`;
  }
}
