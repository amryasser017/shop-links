# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.

## Admin panel

Visit `/admin` (it isn't linked anywhere on the public site) and sign in. Admins can add, edit and delete categories and the stores inside them (name, link, description, logo, phone, address).

### Environment variables (Vercel → Project Settings → Environment Variables)

| Name | Purpose |
| --- | --- |
| `ADMIN_EMAIL` | admin login email |
| `ADMIN_PASSWORD` | admin login password |
| `ADMIN_SECRET` | optional, signs login tokens |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Upstash Redis (Vercel Marketplace → Upstash) so data persists |

Locally, copy `.env.example` to `.env`; `npm run dev` serves the `/api` routes too (in-memory storage).

## Using your own Flask + MySQL back-end

The React app reads the API address from `VITE_API_URL` (see `.env.example`). It defaults to `http://127.0.0.1:5000`. Expected endpoints: `POST /api/login`, `GET /api/categories`, `GET /api/categories/<slug>/stores`, and admin-only (Bearer token) `POST/PUT/DELETE` for `/api/categories` and `/api/stores`.

## Repository layout

- `/` (root): React front-end, deployed on Vercel
- `back-end/`: Flask + MySQL API, deployed on Railway. See `back-end/DEPLOY.md`.
- `docs/ARCHITECTURE.md`: how the parts fit together
