const BASE_URL = import.meta.env.VITE_API_URL

// ── Auth ──────────────────────────────────────────────────────────────────────

function getToken() {
  return localStorage.getItem('token')
}

function setToken(token) {
  localStorage.setItem('token', token)
}

function removeToken() {
  localStorage.removeItem('token')
}

function isAuthenticated() {
  return !!getToken()
}

async function request(path, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `Error ${res.status}`)
  }
  return res.json()
}

// ── Auth endpoints ────────────────────────────────────────────────────────────

async function login(email, password) {
  const data = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  setToken(data.access_token)
  return data
}

async function register(email, password) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

function logout() {
  removeToken()
}

// ── Weights endpoints ─────────────────────────────────────────────────────────

async function getWeights() {
  return request('/weights')
}

async function getWeightsWithPhase() {
  return request('/weights/with-phase')
}

async function getLastWeight() {
  return request('/weights/last')
}

async function postWeight(weight) {
  return request('/weights', {
    method: 'POST',
    body: JSON.stringify({ weight }),
  })
}

// ── Phases endpoints ──────────────────────────────────────────────────────────

async function getPhases() {
  return request('/phases')
}

async function getActivePhase() {
  return request('/phases/active')
}

async function postPhase(phase_type, weight_goal, date_goal) {
  return request('/phases', {
    method: 'POST',
    body: JSON.stringify({ phase_type, weight_goal, date_goal }),
  })
}

async function patchPhaseGoals(weight_goal, date_goal) {
  return request('/phases/active', {
    method: 'PATCH',
    body: JSON.stringify({ weight_goal, date_goal }),
  })
}

// ── Reports endpoints ─────────────────────────────────────────────────────────

async function getReports() {
  return request('/reports')
}

async function postReport(reportData) {
  return request('/reports', {
    method: 'POST',
    body: JSON.stringify(reportData),
  })
}

// ── AI Report ─────────────────────────────────────────────────────────────────

async function getAiReport() {
  const token = getToken()
  const res = await fetch(`${BASE_URL}/generate-report`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('Error generando informe')
  return res.text()
}

// ── Exports ───────────────────────────────────────────────────────────────────

export {
  isAuthenticated,
  login,
  register,
  logout,
  getWeights,
  getWeightsWithPhase,
  getLastWeight,
  postWeight,
  getPhases,
  getActivePhase,
  postPhase,
  patchPhaseGoals,
  getReports,
  postReport,
  getAiReport,
}