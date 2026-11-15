import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Runs the /api handlers inside `vite dev` so the admin panel works locally.
function devApi(env) {
  return {
    name: 'dev-api',
    configureServer(server) {
      Object.assign(process.env, env)
      server.middlewares.use(async (req, res, next) => {
        const m = req.url.match(/^\/api\/(login|data)(\?.*)?$/)
        if (!m) return next()
        let raw = ''
        for await (const chunk of req) raw += chunk
        try { req.body = raw ? JSON.parse(raw) : {} } catch { req.body = {} }
        res.status = (c) => { res.statusCode = c; return res }
        res.json = (o) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(o)) }
        const mod = await server.ssrLoadModule(`/api/${m[1]}.js`)
        await mod.default(req, res)
      })
    },
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), devApi(loadEnv(mode, process.cwd(), ''))],
}))
