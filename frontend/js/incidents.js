/* =========================================================
   incidents.js — drives manage-incidents.html: loads the
   case list, wires search/filter/pagination, and handles
   the edit-modal and delete actions.
   ========================================================= */

const PAGE_SIZE = 10;
let allIncidents = [];
let visibleIncidents = [];
let currentPage = 1;
let searchDebounce;

document.addEventListener('DOMContentLoaded', () => {
  Auth.requireAuth();
  loadIncidents();
  wireToolbar();
  wireModal();
});

async function loadIncidents() {
  const tbody = document.getElementById('incidentsBody');
  const listError = document.getElementById('listError');
  try {
    allIncidents = await Api.listIncidents();
    visibleIncidents = allIncidents;
    currentPage = 1;
    renderTable();
  } catch (err) {
    listError.classList.add('is-visible');
    tbody.innerHTML = '';
  }
}

function wireToolbar() {
  const searchInput = document.getElementById('searchInput');
  const filterCategory = document.getElementById('filterCategory');
  const filterSeverity = document.getElementById('filterSeverity');
  const filterStatus = document.getElementById('filterStatus');
  const clearBtn = document.getElementById('clearFiltersBtn');

  searchInput.addEventListener('input', () => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(applyFilters, 300);
  });
  [filterCategory, filterSeverity, filterStatus].forEach((el) => el.addEventListener('change', applyFilters));
  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    filterCategory.value = '';
    filterSeverity.value = '';
    filterStatus.value = '';
    applyFilters();
  });
}

async function applyFilters() {
  const keyword = document.getElementById('searchInput').value.trim();
  const category = document.getElementById('filterCategory').value;
  const severity = document.getElementById('filterSeverity').value;
  const status = document.getElementById('filterStatus').value;
  const listError = document.getElementById('listError');
  listError.classList.remove('is-visible');

  try {
    if (keyword) {
      visibleIncidents = await Api.searchIncidents(keyword);
    } else if (category || severity || status) {
      const params = {};
      if (category) params.category = category;
      if (severity) params.severity = severity;
      if (status) params.status = status;
      visibleIncidents = await Api.filterIncidents(params);
    } else {
      visibleIncidents = allIncidents;
    }
    currentPage = 1;
    renderTable();
  } catch (err) {
    listError.classList.add('is-visible');
  }
}

function renderTable() {
  const tbody = document.getElementById('incidentsBody');
  const emptyState = document.getElementById('emptyState');
  const totalPages = Math.max(1, Math.ceil(visibleIncidents.length / PAGE_SIZE));
  currentPage = Math.min(currentPage, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = visibleIncidents.slice(start, start + PAGE_SIZE);

  if (pageItems.length === 0) {
    tbody.innerHTML = '';
    emptyState.style.display = 'block';
  } else {
    emptyState.style.display = 'none';
    tbody.innerHTML = pageItems.map((inc) => `
      <tr data-id="${inc.incident_id}">
        <td class="mono">#${inc.incident_id}</td>
        <td>${escapeHtml(inc.title)}</td>
        <td>${escapeHtml(inc.category)}</td>
        <td><span class="stamp ${severityClass(inc.severity)}">${escapeHtml(inc.severity)}</span></td>
        <td><span class="stamp ${statusClass(inc.status)}">${escapeHtml(inc.status)}</span></td>
        <td class="mono">${escapeHtml(inc.reported_by_name || inc.reported_by || '—')}</td>
        <td class="mono">${formatDate(inc.created_at)}</td>
        <td>
          <div class="row-actions">
            <a class="btn btn-secondary btn-sm" href="incident-details.html?id=${inc.incident_id}">View</a>
            <button class="btn btn-secondary btn-sm" data-action="edit" data-id="${inc.incident_id}">Edit</button>
            <button class="btn btn-danger btn-sm nav-admin-only" data-action="delete" data-id="${inc.incident_id}">Delete</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  renderPagination(totalPages);
  wireRowActions();
}

function renderPagination(totalPages) {
  const pagination = document.getElementById('pagination');
  if (totalPages <= 1) { pagination.innerHTML = ''; return; }
  let html = `<button ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">Prev</button>`;
  for (let p = 1; p <= totalPages; p++) {
    html += `<button class="${p === currentPage ? 'is-active' : ''}" data-page="${p}">${p}</button>`;
  }
  html += `<button ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">Next</button>`;
  pagination.innerHTML = html;
  pagination.querySelectorAll('button[data-page]').forEach((btn) => {
    btn.addEventListener('click', () => {
      currentPage = parseInt(btn.dataset.page, 10);
      renderTable();
    });
  });
}

function wireRowActions() {
  document.querySelectorAll('[data-action="edit"]').forEach((btn) => {
    btn.addEventListener('click', () => openEditModal(btn.dataset.id));
  });
  document.querySelectorAll('[data-action="delete"]').forEach((btn) => {
    btn.addEventListener('click', () => handleDelete(btn.dataset.id));
  });
}
async function handleDelete(id) {
  if (!window.confirm(`Delete case #${id}? This removes its evidence and activity log too.`)) {
    return;
  }

  try {
    await Api.deleteIncident(id);
    alert(`Incident #${id} deleted successfully.`);
    await loadIncidents();
  } catch (err) {
    alert(err.message || 'Could not delete this incident.');
  }
}
/* ---------- Edit modal ---------- */
function wireModal() {
  const overlay = document.getElementById('editModalOverlay');
  document.getElementById('editModalClose').addEventListener('click', closeEditModal);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeEditModal(); });
  document.getElementById('editForm').addEventListener('submit', handleEditSubmit);
}

function openEditModal(id) {
  const incident = allIncidents.find((i) => String(i.incident_id) === String(id))
    || visibleIncidents.find((i) => String(i.incident_id) === String(id));
  if (!incident) return;

  document.getElementById('editIncidentId').textContent = `#${incident.incident_id}`;
  document.getElementById('editTitle').value = incident.title || '';
  document.getElementById('editCategory').value = incident.category || 'Other';
  document.getElementById('editSeverity').value = incident.severity || 'Low';
  document.getElementById('editStatus').value = incident.status || 'Open';
  document.getElementById('editDescription').value = incident.description || '';
  document.getElementById('editForm').dataset.id = incident.incident_id;
  hideAlert(document.getElementById('editAlert'));
  document.getElementById('editModalOverlay').classList.add('is-open');
}

function closeEditModal() {
  document.getElementById('editModalOverlay').classList.remove('is-open');
}

async function handleEditSubmit(e) {
  e.preventDefault();
  const id = e.target.dataset.id;
  const alertBox = document.getElementById('editAlert');
  const submitBtn = document.getElementById('editSubmitBtn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Saving…';

  try {
    await Api.updateIncident(id, {
      title: document.getElementById('editTitle').value.trim(),
      category: document.getElementById('editCategory').value,
      severity: document.getElementById('editSeverity').value,
      status: document.getElementById('editStatus').value,
      description: document.getElementById('editDescription').value.trim(),
    });
    closeEditModal();
    await loadIncidents();
    alert(`Incident #${id} updated successfully.`);
  } catch (err) {
    showAlert(alertBox, err.message || 'Could not save changes.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Save changes';
  }
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}
