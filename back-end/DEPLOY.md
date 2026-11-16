# Hosting the back-end (Flask + MySQL) on Railway

Railway can run your Flask app and a MySQL database in one project, and deploys from GitHub.
Check Railway's current pricing and free trial before you start, since plans change.

## 1. The code is already on GitHub
The back-end lives in the `back-end/` folder of the same repository as the website (`amryasser017/shop-links`).
Railway will deploy only that folder.

## 2. Create the project and the database on Railway
1. Sign in at railway.app with GitHub and allow access to the `shop-links` repository.
2. New Project -> Deploy from GitHub repo -> pick `shop-links`.
3. Open the new service -> Settings:
   - **Root Directory:** `back-end`
   - **Branch:** `claude/keen-pasteur-s84jml` (switch it to `main` after the website branch is merged)
4. In the same project: New -> Database -> Add MySQL.

## 3. Create the tables
1. Open the MySQL service -> Data / Connect tab and copy the connection details (host, port, user, password, database name).
2. Connect with MySQL Workbench (or the Railway Data tab) and run `schema.sql`.
   On Railway the database already exists, so skip the first two lines (CREATE DATABASE / USE) and select the existing database.

## 4. Set the variables on the Flask service
Flask service -> Variables:

| Name | Value |
|---|---|
| `DB_HOST` | the MySQL host (or the reference to the MySQL service's host variable) |
| `DB_PORT` | the MySQL port |
| `DB_USER` | the MySQL user |
| `DB_PASSWORD` | the MySQL password |
| `DB_NAME` | the database name |
| `JWT_SECRET` | a NEW 64-character secret (generate it with `python -c "import secrets; print(secrets.token_hex(32))"`) |
| `FRONTEND_ORIGIN` | `https://shop-links.vercel.app` |

## 5. Make it public and start it
1. Flask service -> Settings -> Networking -> Generate Domain.
2. The start command comes from the `Procfile`: `gunicorn app:app`.
3. Test: open `https://YOUR-DOMAIN/api/health` -> `{"status":"ok"}`.

## 6. Create your admin account (once)
On your own computer, in the back-end folder, create a `.env` that points to the Railway MySQL **public** host/port, then run:

```
python create_admin.py
```

Delete the Railway values from your local `.env` afterwards if you want.

## 7. Connect the website
1. In Vercel -> your project -> Settings -> Environment Variables add:
   `VITE_API_URL` = `https://YOUR-DOMAIN` (no trailing slash).
2. Merge the front-end branch into `main` on GitHub.
3. Vercel redeploys. Open `/admin/login`, log in, and re-add your categories and stores.

## 8. Clean up
After the live site works with the new API:
- delete the `api/` folder from the front-end repo,
- delete the Upstash database in Vercel,
- remove the old `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `KV_*`, `REDIS_URL` variables.

## Alternative: PythonAnywhere (free plan available)
Gives Flask + MySQL on one account. You create a web app, upload the files, create the MySQL database from its Databases tab, set the same environment values in the WSGI file, and the API address is `https://YOURNAME.pythonanywhere.com`. The free plan has limits, so check the current terms.
