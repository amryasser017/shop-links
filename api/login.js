import { checkCreds, signToken } from './_lib.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' })
  const { email, password } = req.body || {}
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    return res.status(503).json({ error: 'admin_not_configured' })
  }
  if (!checkCreds(email, password)) {
    await new Promise((r) => setTimeout(r, 500))
    return res.status(401).json({ error: 'invalid_credentials' })
  }
  return res.status(200).json({ token: signToken() })
}
