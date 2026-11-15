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

export async function fetchCategories() {
  const r = await fetch('/api/data')
  if (!r.ok) throw new Error('load_failed')
  const d = await r.json() // throws if the host returned HTML (no API)
  return d.categories
}

export async function login(email, password) {
  const r = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const d = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(d.error || 'login_failed')
  return d.token
}

export async function saveCategories(categories) {
  const r = await fetch('/api/data', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
    body: JSON.stringify({ categories }),
  })
  const d = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(d.error || 'save_failed')
  return d.categories
}
