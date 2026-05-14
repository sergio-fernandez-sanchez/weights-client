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
  if (res.status === 401) {
    removeToken()
    window.location.reload()
    return
  }
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

async function postPhase(phase_type, weight_goal, date_goal, start_date = null) {
  return request('/phases', {
    method: 'POST',
    body: JSON.stringify({ phase_type, weight_goal, date_goal, start_date }),
  })
}

async function patchPhaseGoals(weight_goal, date_goal) {
  return request('/phases/active', {
    method: 'PATCH',
    body: JSON.stringify({ weight_goal, date_goal }),
  })
}

// ── Calories endpoints ────────────────────────────────────────────────────────

async function getCalories() {
  return request('/calories')
}

async function getActiveCalories() {
  return request('/calories/active')
}

async function postCalories(calories) {
  return request('/calories', {
    method: 'POST',
    body: JSON.stringify({ calories }),
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

// ── Gym endpoints ─────────────────────────────────────────────────────────────

async function getExerciseTypes() {
  return request('/gym/exercise-types')
}

async function getGymLogs() {
  return request('/gym/logs')
}

async function postExerciseType(name, category = 'custom') {
  return request('/gym/exercise-types', {
    method: 'POST',
    body: JSON.stringify({ name, category }),
  })
}

async function getActiveGymLogs() {
  return request('/gym/logs/active')
}

async function postGymLog(exercise_type_id, weight, reps) {
  return request('/gym/logs', {
    method: 'POST',
    body: JSON.stringify({ exercise_type_id, weight, reps }),
  })
}

async function patchGymLog(log_id, exercise_type_id, weight, reps) {
  return request(`/gym/logs/${log_id}`, {
    method: 'PATCH',
    body: JSON.stringify({ exercise_type_id, weight, reps }),
  })
}

async function deleteGymLog(log_id) {
  const token = getToken()
  const res = await fetch(`${BASE_URL}/gym/logs/${log_id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  })
  if (res.status === 401) {
    removeToken()
    window.location.reload()
    return
  }
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return true
}

// ── Profile ──────────────────────────────────────────────────────────────────

async function getProfile() {
  return request('/profile')
}

async function saveProfile(profileData) {
  return request('/profile', {
    method: 'PATCH',
    body: JSON.stringify(profileData),
  })
}

// ── AI Report ─────────────────────────────────────────────────────────────────

async function getAiReport() {
  const token = getToken()
  const res = await fetch(`${BASE_URL}/generate-report`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (res.status === 401) {
    removeToken()
    window.location.reload()
    return
  }
  if (!res.ok) throw new Error('Error generando informe')
  return res.text()
}

async function getRawReport() {
  const token = getToken()
  const res = await fetch(`${BASE_URL}/generate-report/raw`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (res.status === 401) {
    removeToken()
    window.location.reload()
    return
  }
  if (!res.ok) throw new Error('Error generando informe')
  return res.text()
}

// ── Exports ───────────────────────────────────────────────────────────────────

export {
  getProfile,
  saveProfile,
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
  getRawReport,
  getCalories,
  getActiveCalories,
  postCalories,
  getExerciseTypes,
  postExerciseType,
  getActiveGymLogs,
  getGymLogs,
  postGymLog,
  patchGymLog,
  deleteGymLog,
}