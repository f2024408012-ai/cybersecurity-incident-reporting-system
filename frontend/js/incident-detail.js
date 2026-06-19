/* =========================================================
   incident-detail.js — drives incident-details.html.
   Reads ?id= from the URL, renders the case, and wires the
   admin status-update control plus the evidence uploader.
   ========================================================= */

function getIncidentIdFromUrl() {
  return new URLSearchParams(window.location.search).get('id');
}

document.addEventListener('DOMContentLoaded', () => {
  Auth.requireAuth();
  const id = getIncidentIdFromUrl();
  if (!id) {
    document.getElementById('loadError').classList.add('is-visible');
    return;
  }
  loadCase(id);
  wireStatusUpdate(id);
  wireEvidenceUpload(id);
});

async function loadCase(id) {
  const loadError = document.getElementById('loadError');
  const content = document.getElementById('caseContent');

  try {
    const incident = await Api.getIncident(id);
    const logs = await Api.getIncidentLogs(id);
    const evidence = await Api.getIncidentEvidence(id);

    incident.logs = logs;
    incident.evidence = evidence;

    renderCase(incident);

    content.style.display = 'block';
  }
  catch (err) {
    console.error(err);
    loadError.classList.add('is-visible');
  }
}

function renderCase(inc) {
  document.getElementById('caseId').textContent = `Case #${inc.incident_id}`;
  document.getElementById('caseTitle').textContent = inc.title;
  document.getElementById('caseCategory').textContent = inc.category;
  document.getElementById('caseDescription').textContent = inc.description;
  document.getElementById('caseReporter').textContent = inc.reported_by_name || inc.reported_by || 'Unknown';
  document.getElementById('caseCreated').textContent = formatDate(inc.created_at);

  const sevEl = document.getElementById('caseSeverity');
  sevEl.textContent = inc.severity;
  sevEl.className = `stamp stamp-lg ${severityClass(inc.severity)}`;

  const statusEl = document.getElementById('caseStatus');
  statusEl.textContent = inc.status;
  statusEl.className = `stamp stamp-lg ${statusClass(inc.status)}`;

  const statusSelect = document.getElementById('statusSelect');
  if (statusSelect) statusSelect.value = inc.status;

  renderEvidence(inc.evidence || []);
  renderActivityLog(inc.activity_log || inc.logs || []);
}

function renderEvidence(items) {
  const list = document.getElementById('evidenceList');
  if (!items.length) {
    list.innerHTML = '<li class="muted">No evidence attached yet.</li>';
    return;
  }
  list.innerHTML = items.map((ev) => `
    <li class="evidence-item">
      <span class="fname">${escapeHtml(ev.file_name)}</span>
      <a href="${ev.file_path}" target="_blank" rel="noopener" class="btn btn-secondary btn-sm">Download</a>
    </li>
  `).join('');
}

function renderActivityLog(items) {
  const timeline = document.getElementById('activityTimeline');
  if (!items.length) {
    timeline.innerHTML = '<div class="timeline-item"><span class="ts">—</span><div class="action muted">No activity recorded yet.</div></div>';
    return;
  }
  timeline.innerHTML = items
    .slice()
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .map((log) => `
      <div class="timeline-item">
        <span class="ts">${formatDate(log.timestamp)}</span>
        <div class="action">${escapeHtml(log.action)}${log.performed_by_name ? ` · ${escapeHtml(log.performed_by_name)}` : ''}</div>
      </div>
    `).join('');
}

function wireStatusUpdate(id) {
  const btn = document.getElementById('statusSaveBtn');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    const alertBox = document.getElementById('statusAlert');
    hideAlert(alertBox);
    btn.disabled = true;
    btn.textContent = 'Saving…';
    try {
      const updated = await Api.updateIncident(id, { status: document.getElementById('statusSelect').value });
      showAlert(alertBox, 'Status updated.', 'success');
      await loadCase(id);
    } catch (err) {
      showAlert(alertBox, err.message || 'Could not update status.', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Save status';
    }
  });
}

function wireEvidenceUpload(id) {
  const form = document.getElementById('evidenceForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('evidenceFile');
    const file = fileInput.files[0];
    if (!file) return;
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Uploading…';
    try {
      await Api.uploadEvidence(id, file);
      fileInput.value = '';
      await loadCase(id);
    } catch (err) {
      window.alert(err.message || 'Could not upload evidence.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Attach evidence';
    }
  });
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}
