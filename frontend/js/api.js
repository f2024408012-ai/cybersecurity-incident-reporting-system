/* =========================================================
   api.js — single place that talks to the FastAPI backend.
   Update API_BASE_URL once the backend is deployed on Render;
   everything else in the app calls the helpers below.
   ========================================================= */

const API_BASE_URL = "http://127.0.0.1:8000";// replace with your Render URL

const Auth = {
  _store() {
    return localStorage.getItem('id_persist') === '0' ? sessionStorage : localStorage;
  },
  getToken() { return this._store().getItem('id_token'); },
  getUser() {
    const raw = this._store().getItem('id_user');
    return raw ? JSON.parse(raw) : null;
  },
  setSession(token, user, remember = true) {
    localStorage.setItem('id_persist', remember ? '1' : '0');
    const store = remember ? localStorage : sessionStorage;
    store.setItem('id_token', token);
    store.setItem('id_user', JSON.stringify(user));
  },
  clearSession() {
    localStorage.removeItem('id_token');
    localStorage.removeItem('id_user');
    localStorage.removeItem('id_persist');
    sessionStorage.removeItem('id_token');
    sessionStorage.removeItem('id_user');
  },
  isAuthenticated() { return !!this.getToken(); },
  isAdmin() {
    const user = this.getUser();
    return !!user && user.role === 'admin';
  },
  requireAuth() {
    if (!this.isAuthenticated()) {
      window.location.href = 'login.html';
    }
  },
};

/**
 * apiRequest — wraps fetch with the API base URL, JSON handling,
 * the bearer token, and consistent error objects.
 * @param {string} path e.g. '/incidents'
 * @param {object} options { method, body, isFormData }
 */
async function apiRequest(path, options = {}) {
  const { method = 'GET', body, isFormData = false } = options;
  const headers = {};
  const token = Auth.getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isFormData) headers['Content-Type'] = 'application/json';

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: isFormData ? body : (body ? JSON.stringify(body) : undefined),
    });
  } catch (networkErr) {
    throw { status: 0, message: 'Could not reach the server. Check your connection and try again.' };
  }

  if (response.status === 401) {
    Auth.clearSession();
  }

  let data = null;
  const text = await response.text();
  if (text) {
    try { data = JSON.parse(text); } catch (_) { data = null; }
  }

  if (!response.ok) {
    const message = (data && (data.detail || data.message)) || `Request failed (${response.status}).`;
    throw { status: response.status, message, data };
  }

  return data;
}

const Api = {
  register(payload) { return apiRequest('/register', { method: 'POST', body: payload }); },
  login(payload) { return apiRequest('/login', { method: 'POST', body: payload }); },
  getUser(id) { return apiRequest(`/users/${id}`); },
  updateUser(id, payload) { return apiRequest(`/users/${id}`, { method: 'PUT', body: payload }); },
  listUsers() { return apiRequest('/users'); },
  deleteUser(id) { return apiRequest(`/users/${id}`, { method: 'DELETE' }); },

  createIncident(payload) { return apiRequest('/incidents', { method: 'POST', body: payload }); },
  listIncidents() { return apiRequest('/incidents'); },
  getIncident(id) { return apiRequest(`/incidents/${id}`); },
  getIncidentLogs(id) {
  return apiRequest(`/incidents/${id}/logs`);
},

getIncidentEvidence(id) {
  return apiRequest(`/incidents/${id}/evidence`);
},
  updateIncident(id, payload) { return apiRequest(`/incidents/${id}`, { method: 'PUT', body: payload }); },
  deleteIncident(id) { return apiRequest(`/incidents/${id}`, { method: 'DELETE' }); },
  searchIncidents(keyword) { return apiRequest(`/incidents/search?q=${encodeURIComponent(keyword)}`); },
  filterIncidents(params) {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/incidents/filter?${qs}`);
  },
  dashboardStats() { return apiRequest('/dashboard/stats'); },
  uploadEvidence(incidentId, file) {
    const form = new FormData();
    form.append('incident_id', incidentId);
    form.append('file', file);
    return apiRequest('/evidence/upload', { method: 'POST', body: form, isFormData: true });
  },
};
