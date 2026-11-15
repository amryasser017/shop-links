import crypto from 'node:crypto'

const KEY = 'shoplinks:categories'
const mem = {}

function redisCfg() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
  return url && token ? { url, token } : null
}

async function redis(cfg, command) {
  const r = await fetch(cfg.url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  })
  if (!r.ok) throw new Error('storage_error')
  return (await r.json()).result
}

export async function loadData() {
  const cfg = redisCfg()
  if (!cfg) return mem[KEY] ?? null
  const raw = await redis(cfg, ['GET', KEY])
  return raw ? JSON.parse(raw) : null
}

export async function saveData(data) {
  const cfg = redisCfg()
  if (!cfg) {
    if (process.env.VERCEL) throw new Error('storage_not_configured')
    mem[KEY] = data
    return
  }
  await redis(cfg, ['SET', KEY, JSON.stringify(data)])
}

// ---------- auth ----------
const sha = (s) => crypto.createHash('sha256').update(String(s)).digest()
const safeEq = (a, b) => crypto.timingSafeEqual(sha(a), sha(b))
const secret = () => process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || ''

export function checkCreds(email, password) {
  const e = process.env.ADMIN_EMAIL
  const p = process.env.ADMIN_PASSWORD
  if (!e || !p) return false
  const okE = safeEq(String(email || '').trim().toLowerCase(), e.trim().toLowerCase())
  const okP = safeEq(password || '', p)
  return okE && okP
}

export function signToken() {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + 12 * 3600 * 1000 })).toString('base64url')
  const sig = crypto.createHmac('sha256', secret()).update(payload).digest('base64url')
  return `${payload}.${sig}`
}

export function verifyToken(req) {
  const h = req.headers.authorization || ''
  const token = h.startsWith('Bearer ') ? h.slice(7) : ''
  const [payload, sig] = token.split('.')
  if (!payload || !sig || !secret()) return false
  const expect = crypto.createHmac('sha256', secret()).update(payload).digest('base64url')
  if (!safeEq(sig, expect)) return false
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString()).exp > Date.now()
  } catch {
    return false
  }
}

// ---------- validation ----------
const str = (v, max) => String(v ?? '').trim().slice(0, max)
const httpUrl = (v) => {
  const s = str(v, 500)
  if (!s) return ''
  try {
    const u = new URL(s)
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : null
  } catch {
    return null
  }
}

export function sanitizeCategories(input) {
  if (!Array.isArray(input) || input.length > 200) return null
  const slugs = new Set()
  const out = []
  for (const c of input) {
    const name = str(c?.name, 60)
    const slug = str(c?.slug, 80)
    if (!name || !/^[\p{L}\p{N}-]+$/u.test(slug) || slugs.has(slug) || !Array.isArray(c.stores)) return null
    slugs.add(slug)
    const stores = []
    for (const s of c.stores.slice(0, 500)) {
      const sName = str(s?.name, 80)
      const url = httpUrl(s?.url)
      const logo = httpUrl(s?.logo)
      if (!sName || !url || logo === null) return null
      stores.push({
        id: str(s.id, 40) || crypto.randomUUID(),
        name: sName,
        url,
        description: str(s.description, 400),
        logo,
        phone: str(s.phone, 40),
        address: str(s.address, 200),
      })
    }
    out.push({ slug, name, icon: str(c.icon, 8) || '🛍️', stores })
  }
  return out
}
