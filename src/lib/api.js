// CHANGED: this file now talks to YOUR Flask API (MySQL) instead of the Vercel /api functions.
//
// The address of the API comes from one setting, VITE_API_URL (see .env.example).
// While you test on your computer it defaults to your local Flask server.
const API = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000').replace(/\/$/, '')

const TOKEN_KEY = 'shoplinks_admin_token'

export const getToken = () => {
  try { return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) } catch { return null }
}
// persist=true keeps the login across browser restarts; otherwise only for this tab
export const setToken = (t, persist = false) => {
  try {
    localStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
    if (t) (persist ? localStorage : sessionStorage).setItem(TOKEN_KEY, t)
  } catch { /* ignore */ }
}

// CHANGED: one helper that every call goes through.
// - auth: true adds the "Authorization: Bearer <token>" header your Flask admin routes require
// - Flask answers errors as {"error": "code"}; we throw that code so the UI can show a message
async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = {}
  if (body) headers['Content-Type'] = 'application/json'
  if (auth) headers.Authorization = `Bearer ${getToken()}`
  let res
  try {
    res = await fetch(API + path, { method, headers, body: body ? JSON.stringify(body) : undefined })
  } catch {
    throw new Error('network_error') // API is down / wrong address / CORS
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'request_failed')
  return data
}

// ---- public (no token) ------------------------------------------------------
// CHANGED: GET /api/categories  -> [{ id, name, slug, icon, store_count }]
export const fetchCategories = () => request('/api/categories')

// CHANGED: NEW. Stores now have their own endpoint:
// GET /api/categories/<slug>/stores -> { category: {...}, stores: [...] }
export const fetchCategoryStores = (slug) => request(`/api/categories/${encodeURIComponent(slug)}/stores`)

// CHANGED: POST /api/login -> { token }
export async function login(email, password) {
  const data = await request('/api/login', { method: 'POST', body: { email, password } })
  return data.token
}

// ---- admin (token required) -------------------------------------------------
// CHANGED: before, the dashboard saved the WHOLE list in one PUT.
// Now there is one function per Flask endpoint (add / edit / delete).
export const createCategory = (c) => request('/api/categories', { method: 'POST', body: c, auth: true })
export const updateCategory = (id, c) => request(`/api/categories/${id}`, { method: 'PUT', body: c, auth: true })
export const deleteCategory = (id) => request(`/api/categories/${id}`, { method: 'DELETE', auth: true })

export const createStore = (categoryId, s) =>
  request(`/api/categories/${categoryId}/stores`, { method: 'POST', body: s, auth: true })
export const updateStore = (id, s) => request(`/api/stores/${id}`, { method: 'PUT', body: s, auth: true })
export const deleteStore = (id) => request(`/api/stores/${id}`, { method: 'DELETE', auth: true })
