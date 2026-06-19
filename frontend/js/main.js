/* =========================================================
   main.js — runs on every page. Keeps the nav in sync with
   login state and wires the logout control.
   ========================================================= */

(function () {
  function applyAuthState() {
    const user = Auth.getUser();
    document.body.classList.toggle('is-authenticated', Auth.isAuthenticated());
    document.body.classList.toggle('is-admin', Auth.isAdmin());

    const nameSlots = document.querySelectorAll('[data-user-name]');
    nameSlots.forEach((el) => { el.textContent = user ? user.full_name : ''; });
  }

  function wireLogout() {
    document.querySelectorAll('[data-action="logout"]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        Auth.clearSession();
        window.location.href = 'login.html';
      });
    });
  }

  function highlightActiveNav() {
    const here = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.site-nav a[href]').forEach((link) => {
      if (link.getAttribute('href') === here) link.classList.add('is-active');
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    applyAuthState();
    wireLogout();
    highlightActiveNav();
  });
})();

/** Small helper used by several pages to show alert banners. */
function showAlert(el, message, type) {
  if (!el) return;
  el.textContent = message;
  el.className = `alert is-visible alert-${type}`;
}
function hideAlert(el) {
  if (!el) return;
  el.classList.remove('is-visible');
}

/** Formats an ISO timestamp into a short, readable string. */
function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/** Toggles the .has-error state on a .field wrapper by id. */
function setFieldError(fieldId, hasError) {
  const field = document.getElementById(fieldId);
  if (field) field.classList.toggle('has-error', hasError);
}

/** Maps a severity/status string to its stamp CSS class. */
function severityClass(sev) {
  return 'sev-' + String(sev || '').toLowerCase();
}
function statusClass(status) {
  return 'status-' + String(status || '').toLowerCase().replace(/\s+/g, '-').replace('in-progress', 'progress');
}
