/* =========================================================
   dashboard.js — populates the welcome banner, stat cards,
   and the five most recent incidents.
   ========================================================= */

document.addEventListener('DOMContentLoaded', async () => {
  Auth.requireAuth();
  const user = Auth.getUser();
  const welcomeName = document.getElementById('welcomeName');
  if (welcomeName && user) welcomeName.textContent = `Welcome back, ${user.full_name}`;

  const statsError = document.getElementById('statsError');
  try {
    const stats = await Api.dashboardStats();
    document.getElementById('statTotal').textContent = stats.total ?? 0;
    document.getElementById('statOpen').textContent = stats.open ?? 0;
    document.getElementById('statProgress').textContent = stats.in_progress ?? stats['in-progress'] ?? 0;
    document.getElementById('statResolved').textContent = stats.resolved ?? 0;
  } catch (err) {
    statsError.classList.add('is-visible');
  }

  const recentBody = document.getElementById('recentBody');
  const recentEmpty = document.getElementById('recentEmpty');
  try {
    const incidents = await Api.listIncidents();
    const recent = [...incidents]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5);

    if (recent.length === 0) {
      recentBody.innerHTML = '';
      recentEmpty.style.display = 'block';
    } else {
      recentBody.innerHTML = recent.map((inc) => `
        <tr>
          <td class="mono">#${inc.incident_id}</td>
          <td><a href="incident-details.html?id=${inc.incident_id}">${escapeHtml(inc.title)}</a></td>
          <td>${escapeHtml(inc.category)}</td>
          <td><span class="stamp ${severityClass(inc.severity)}">${escapeHtml(inc.severity)}</span></td>
          <td><span class="stamp ${statusClass(inc.status)}">${escapeHtml(inc.status)}</span></td>
          <td class="mono">${formatDate(inc.created_at)}</td>
        </tr>
      `).join('');
    }
  } catch (err) {
    recentBody.innerHTML = `<tr><td colspan="6" class="muted">Could not load recent incidents.</td></tr>`;
  }
});

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}
