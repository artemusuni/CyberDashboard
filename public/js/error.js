// ── Shared error boundary helpers ──

export function errorScreen(container, message, onRetry) {
  container.innerHTML = `
    <div class="error-boundary">
      <div class="error-boundary-inner">
        <div class="error-code">ERR</div>
        <div class="error-title">SOMETHING WENT WRONG</div>
        <div class="error-msg">${message}</div>
        ${onRetry ? `<button class="error-retry-btn" id="errorRetryBtn">RETRY</button>` : ''}
      </div>
    </div>
  `;
  if (onRetry) {
    container.querySelector('#errorRetryBtn')?.addEventListener('click', onRetry);
  }
}

export function panelError(container, message) {
  container.innerHTML = `
    <div class="panel-error-state">
      <span class="news-tag critical">ERROR</span>
      <p>${message}</p>
    </div>
  `;
}

// ── Global uncaught error handler ──
window.addEventListener('unhandledrejection', e => {
  console.error('Unhandled promise rejection:', e.reason);
});

window.addEventListener('error', e => {
  console.error('Uncaught error:', e.message);
});
