# Shop Links – Architecture

## 1. Big picture

```mermaid
flowchart LR
    Dev([Developer / Claude]) -->|git push| GH[(GitHub repo<br/>branch: main)]
    GH -->|webhook: auto build + deploy| V

    subgraph V[Vercel]
        direction TB
        CDN[Static hosting + CDN<br/>React app: index.html, JS, CSS]
        FN[Serverless functions<br/>/api/login · /api/data]
        ENV[/Environment variables<br/>ADMIN_EMAIL · ADMIN_PASSWORD<br/>KV_REST_API_URL · KV_REST_API_TOKEN/]
        ENV -.read at runtime.-> FN
    end

    U([Visitor]) -->|HTTPS GET pages| CDN
    A([Admin]) -->|HTTPS /admin| CDN
    CDN -->|serves SPA| B

    subgraph B[Browser: React single-page app]
        direction TB
        R[React Router]
        P[Public pages<br/>Home · Category]
        AD[Admin pages<br/>Lamp login · Dashboard]
        DC[DataContext<br/>holds categories in memory]
        R --> P & AD
        P --> DC
        AD --> DC
    end

    B -->|GET /api/data| FN
    B -->|POST /api/login| FN
    B -->|PUT /api/data + Bearer token| FN
    FN -->|REST over HTTPS| UP[(Upstash Redis<br/>key: shoplinks:categories)]
```

| Part | Role | Where it runs |
|---|---|---|
| React SPA (`src/`) | UI for visitors and admin | User's browser, files served by Vercel CDN |
| Serverless API (`api/`) | Login, read and save data, validation | Vercel Functions (Node) |
| Upstash Redis | Stores all categories and stores as one JSON value | Upstash cloud |
| Env variables | Admin credentials, DB access | Vercel project settings |
| GitHub | Source of truth; push to `main` triggers deploy | github.com |

## 2. Visitor flow (public, read-only)

```mermaid
sequenceDiagram
    actor U as Visitor
    participant B as Browser (React)
    participant CDN as Vercel CDN
    participant F as /api/data
    participant R as Upstash Redis

    U->>CDN: open shop-links.vercel.app
    CDN-->>B: index.html + JS + CSS
    Note over B: Starts with built-in default data
    B->>F: GET /api/data
    F->>R: GET shoplinks:categories
    R-->>F: JSON (or null)
    F-->>B: { categories }
    B-->>U: renders categories and stores
```

If the API fails or no data has been saved yet, the app keeps showing the default data bundled in `src/data/categories.js`.

## 3. Admin login flow

```mermaid
sequenceDiagram
    actor A as Admin
    participant B as Browser (/admin/login)
    participant L as /api/login
    participant E as Env variables

    A->>B: pull lamp chain, enter email + password
    B->>L: POST { email, password }
    L->>E: read ADMIN_EMAIL / ADMIN_PASSWORD
    L->>L: constant-time compare
    alt correct
        L-->>B: signed token (HMAC-SHA256, expires in 12h)
        B->>B: store token (session or local storage)
        B-->>A: redirect to /admin dashboard
    else wrong
        L-->>B: 401 after 0.5s delay
        B-->>A: "Wrong email or password"
    end
```

## 4. Admin save flow (create / edit / delete)

```mermaid
sequenceDiagram
    actor A as Admin
    participant B as Dashboard
    participant F as /api/data (PUT)
    participant R as Upstash Redis

    A->>B: add / edit / delete category or store
    B->>B: build the full updated list
    B->>F: PUT { categories } + Authorization: Bearer token
    F->>F: verify token signature + expiry
    F->>F: validate and sanitize (names, http(s) URLs, lengths)
    alt token and data valid
        F->>R: SET shoplinks:categories (JSON)
        R-->>F: OK
        F-->>B: 200 { categories }
        B-->>A: updated list + success message
    else invalid
        F-->>B: 401 unauthorized / 400 invalid_data
        B-->>A: error message (401 signs you out)
    end
```

## 5. Deployment pipeline

```mermaid
flowchart LR
    C[Code change] --> PR[Pull request] --> M[Merge to main]
    M --> VB[Vercel: npm run build<br/>vite build to dist/]
    VB --> D1[Static files to CDN]
    VB --> D2[api/*.js to serverless functions]
    D1 & D2 --> LIVE[Live: shop-links.vercel.app]
```

`vercel.json` rewrites every non-`/api` path to `index.html`, so React Router handles `/admin`, `/admin/login`, and `/category/:slug`.

## 6. Code map

```
api/
  _lib.js        Redis access, token sign/verify, input validation
  login.js       POST: check credentials, return token
  data.js        GET: public read · PUT: admin-only save
src/
  App.jsx        Routes: /, /category/:slug, /admin/*
  lib/api.js     fetch helpers + token storage
  lib/DataContext.jsx   loads categories once, shares them
  pages/         Home, CategoryPage
  components/    CategoryCard, StoreCard, SearchBar
  admin/         AdminPage (dashboard CRUD), LampLogin (+ lamp.css, lampMarkup.js)
vite.config.js   dev-only middleware so /api works under `npm run dev`
```

## 7. Security model

- Credentials live only in Vercel env vars; the browser never receives them.
- Every write needs a valid signed token; the server re-validates all data.
- Public visitors can only read.
- Known gaps: no lockout after repeated wrong passwords, a single admin account, no automatic database backups (free Upstash plan).
