import { loadData, saveData, verifyToken, sanitizeCategories } from './_lib.js'

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      res.setHeader('Cache-Control', 'no-store')
      return res.status(200).json({ categories: await loadData() })
    }
    if (req.method === 'PUT') {
      if (!verifyToken(req)) return res.status(401).json({ error: 'unauthorized' })
      const clean = sanitizeCategories(req.body?.categories)
      if (!clean) return res.status(400).json({ error: 'invalid_data' })
      await saveData(clean)
      return res.status(200).json({ categories: clean })
    }
    return res.status(405).json({ error: 'method_not_allowed' })
  } catch (e) {
    const code = e.message === 'storage_not_configured' ? 503 : 500
    return res.status(code).json({ error: e.message || 'server_error' })
  }
}
