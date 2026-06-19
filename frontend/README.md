# Incident Desk — Frontend

Static HTML5 / CSS3 / vanilla JS frontend for the Cybersecurity Incident Reporting and
Tracking System (OSSD Final Project, Phase 1 proposal). No build step — open the files
directly or deploy as-is to Vercel.

## Structure

```
incident-desk/
├── index.html              Home / landing page
├── about.html               About the project + tech stack
├── register.html            Account creation
├── login.html                Sign in
├── dashboard.html           Stats + 5 most recent incidents
├── report-incident.html      Submit a new incident (+ optional evidence)
├── manage-incidents.html     Search / filter / paginate / edit / delete
├── incident-details.html     Single case: fields, evidence, activity log
├── css/
│   └── styles.css            Design tokens + all component styles
└── js/
    ├── api.js                 API_BASE_URL, fetch wrapper, Auth (JWT storage)
    ├── main.js                Nav auth-state, logout, date/badge helpers
    ├── auth.js                Register + login form logic
    ├── dashboard.js           Dashboard stats + recent table
    ├── report.js              Incident submission + evidence upload
    ├── incidents.js           Manage-incidents list, filters, edit modal
    └── incident-detail.js     Single case view, status update, evidence
```

## Before you deploy

Open `js/api.js` and set the Render URL once your backend is live:

```js
const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:8000'
  : 'https://YOUR-RENDER-SERVICE.onrender.com';
```

The frontend expects the API surface defined in the Phase 1 proposal (`/register`,
`/login`, `/incidents`, `/incidents/search`, `/incidents/filter`, `/dashboard/stats`,
`/evidence/upload`, `/users`, etc.) and a JWT whose payload includes `user_id` (or `sub`),
`full_name`, and `role` — `auth.js` decodes those claims after login to populate the nav
and gate admin-only controls (the `nav-admin-only` class).

## Local preview

No server is required for static files, but `fetch()` to a `localhost` API works best
served over HTTP rather than `file://`. Either:

```bash
npx serve .
# or
python3 -m http.server 5500
```

## Deploy to Vercel

1. Push this folder to your GitHub repository (already set up).
2. In Vercel, import the repo and set the project root to this folder (or repo root, if
   this is the whole repo).
3. Framework preset: **Other** (static HTML — no build command, no output directory
   override needed).
4. Deploy. Every push to `main` redeploys automatically.

## Notes

- Auth state lives in `localStorage` (or `sessionStorage` if "Remember me" is left
  unchecked) as `id_token` / `id_user` — there's no server-side session.
- Admin-only controls (delete incident, update status) are hidden via the `is-admin`
  body class, but the backend must still enforce these checks server-side; the frontend
  hiding controls is a UX nicety, not the security boundary.
- `incidents.js` calls `/incidents/search` and `/incidents/filter` directly when a
  search term or filter is active, and falls back to the full `/incidents` list
  otherwise, matching the API design in Section 10 of the proposal.
