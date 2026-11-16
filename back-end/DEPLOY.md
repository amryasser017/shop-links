# Hosting the back-end for free: Render (Flask) + TiDB Cloud (MySQL)

Free plans change. Before you start, check the current limits on render.com/docs/free and on the TiDB Cloud pricing page.

What to expect on the free plans:
- Render's free web service goes to sleep after about 15 minutes without visitors. The first visit after that takes about a minute to wake up.
- TiDB Cloud Starter is MySQL-compatible and has a free usage quota.

## 1. The code is already on GitHub
The back-end is the `back-end/` folder of the repository `amryasser017/shop-links`.

## 2. Create the free database (TiDB Cloud)
1. Sign up at tidbcloud.com and create a **Starter** (free) cluster.
2. Open the cluster -> **Connect** and note: host, port (usually 4000), user, password.
3. Create a database called `store_links` (SQL Editor: `CREATE DATABASE store_links;`).
4. In the SQL Editor, select `store_links` and run the contents of `schema.sql`, **skipping its first two lines** (CREATE DATABASE / USE).
5. Check: `SHOW TABLES;` lists admin, categories, stores.

## 3. Create the free web service (Render)
1. Sign up at render.com with GitHub.
2. New -> **Web Service** -> pick the `shop-links` repository.
3. Settings:
   - **Branch:** `claude/keen-pasteur-s84jml` (switch to `main` after the website branch is merged)
   - **Root Directory:** `back-end`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn app:app`
   - **Instance Type:** Free
4. Add these environment variables:

| Name | Value |
|---|---|
| `DB_HOST` | the TiDB host |
| `DB_PORT` | the TiDB port (usually 4000) |
| `DB_USER` | the TiDB user |
| `DB_PASSWORD` | the TiDB password |
| `DB_NAME` | `store_links` |
| `DB_SSL` | `true` |
| `JWT_SECRET` | a NEW secret: `python -c "import secrets; print(secrets.token_hex(32))"` |
| `FRONTEND_ORIGIN` | `https://shop-links.vercel.app` |

5. Create the service and wait for the first deploy.
6. Open `https://YOUR-SERVICE.onrender.com/api/health` -> `{"status":"ok"}` (the first call can take a minute).

## 4. Create your admin account (once)
On your computer, in the `back-end` folder, make a `.env` with the same DB_* values as above (and `DB_SSL=true`), then run:

```
pip install -r requirements.txt
python create_admin.py
```

Delete the `.env` afterwards if you want. Never upload it.

## 5. Connect the website
1. In Vercel -> Settings -> Environment Variables add `VITE_API_URL` = `https://YOUR-SERVICE.onrender.com` (no slash at the end).
2. Merge the front-end branch into `main`. Vercel redeploys.
3. Switch the Render branch to `main`.
4. Open `/admin/login`, log in, and re-add your categories and stores.

## 6. Clean up
Delete the `api/` folder from the front-end, the Upstash database, and the old variables (`ADMIN_EMAIL`, `ADMIN_PASSWORD`, `KV_*`, `REDIS_URL`).

## Optional: avoid the one-minute wake-up
A free uptime monitor (for example UptimeRobot) can open `/api/health` every 5-10 minutes so the service stays awake. Check Render's current free hours and terms first.
