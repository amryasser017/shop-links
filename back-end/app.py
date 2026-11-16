import os
import re
import datetime
from functools import wraps
from urllib.parse import urlparse

import jwt
import pymysql
from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.security import check_password_hash

from db import get_connection

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": os.getenv("FRONTEND_ORIGIN", "*")}})


# ---------------------------------------------------------------- helpers
def fetch_all(sql, params=()):
    db = get_connection()
    try:
        with db.cursor() as cur:
            cur.execute(sql, params)
            return cur.fetchall()
    finally:
        db.close()


def fetch_one(sql, params=()):
    db = get_connection()
    try:
        with db.cursor() as cur:
            cur.execute(sql, params)
            return cur.fetchone()
    finally:
        db.close()


def execute(sql, params=()):
    """INSERT / UPDATE / DELETE. Returns the new row id (for INSERT)."""
    db = get_connection()
    try:
        with db.cursor() as cur:
            cur.execute(sql, params)
            db.commit()
            return cur.lastrowid
    finally:
        db.close()


def text(value, max_len):
    return str(value or "").strip()[:max_len]


def valid_url(value):
    p = urlparse(value)
    return p.scheme in ("http", "https") and bool(p.netloc)


def slugify(name):
    return re.sub(r"[^\w]+", "-", name.lower()).strip("-")


def error(code, status):
    return jsonify({"error": code}), status


def admin_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        token = request.headers.get("Authorization", "").removeprefix("Bearer ")
        try:
            jwt.decode(token, os.getenv("JWT_SECRET"), algorithms=["HS256"])
        except jwt.InvalidTokenError:
            return error("unauthorized", 401)
        return f(*args, **kwargs)
    return wrapper


STORE_COLUMNS = ("ID AS id, category_id, name, url, description, "
                 "logo_url AS logo, phone, address")


def store_json(row):
    """Make optional fields '' instead of null for the front-end."""
    for key in ("description", "logo", "phone", "address"):
        row[key] = row[key] or ""
    return row


def category_json(row):
    row["icon"] = row["icon"] or ""
    row["description"] = row.get("description") or ""
    return row


# ---------------------------------------------------------------- health
@app.route("/api/health")
def health():
    fetch_one("SELECT 1")
    return jsonify({"status": "ok"})


# ---------------------------------------------------------------- login
@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = text(data.get("email"), 255)
    password = data.get("password") or ""

    admin = fetch_one("SELECT * FROM admin WHERE email = %s", (email,))
    if not admin or not check_password_hash(admin["password_hash"], password):
        return error("invalid_credentials", 401)

    token = jwt.encode(
        {"id": admin["ID"],
         "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=12)},
        os.getenv("JWT_SECRET"),
        algorithm="HS256",
    )
    return jsonify({"token": token})


# ---------------------------------------------------------------- public reads
@app.route("/api/categories", methods=["GET"])
def list_categories():
    rows = fetch_all("""
        SELECT c.ID AS id, c.name, c.slug, c.icon, c.description,
               COUNT(s.ID) AS store_count
        FROM categories c
        LEFT JOIN stores s ON s.category_id = c.ID
        GROUP BY c.ID
        ORDER BY c.ID
    """)
    return jsonify([category_json(r) for r in rows])


@app.route("/api/categories/<slug>/stores", methods=["GET"])
def list_category_stores(slug):
    category = fetch_one(
        "SELECT ID AS id, name, slug, icon, description FROM categories WHERE slug = %s", (slug,))
    if not category:
        return error("not_found", 404)
    stores = fetch_all(
        f"SELECT {STORE_COLUMNS} FROM stores WHERE category_id = %s ORDER BY ID",
        (category["id"],))
    return jsonify({"category": category_json(category),
                    "stores": [store_json(s) for s in stores]})


# ---------------------------------------------------------------- admin: categories
@app.route("/api/categories", methods=["POST"])
@admin_required
def create_category():
    data = request.get_json(silent=True) or {}
    name = text(data.get("name"), 255)
    if not name:
        return error("name_required", 400)
    slug = text(data.get("slug"), 255) or slugify(name)
    if not slug:
        return error("slug_required", 400)

    try:
        new_id = execute(
            "INSERT INTO categories (name, slug, icon, description) VALUES (%s, %s, %s, %s)",
            (name, slug, text(data.get("icon"), 16) or "🛍️", text(data.get("description"), 2000)))
    except pymysql.err.IntegrityError:
        return error("slug_exists", 409)

    row = fetch_one("SELECT ID AS id, name, slug, icon, description FROM categories WHERE ID = %s", (new_id,))
    row["store_count"] = 0
    return jsonify(category_json(row)), 201


@app.route("/api/categories/<int:category_id>", methods=["PUT"])
@admin_required
def update_category(category_id):
    current = fetch_one("SELECT * FROM categories WHERE ID = %s", (category_id,))
    if not current:
        return error("not_found", 404)

    data = request.get_json(silent=True) or {}
    name = text(data.get("name"), 255) or current["name"]
    slug = text(data.get("slug"), 255) or current["slug"]
    icon = text(data["icon"], 16) if "icon" in data else current["icon"]
    description = text(data["description"], 2000) if "description" in data else current["description"]

    try:
        execute("UPDATE categories SET name=%s, slug=%s, icon=%s, description=%s WHERE ID=%s",
                (name, slug, icon, description, category_id))
    except pymysql.err.IntegrityError:
        return error("slug_exists", 409)

    row = fetch_one("SELECT ID AS id, name, slug, icon, description FROM categories WHERE ID = %s", (category_id,))
    return jsonify(category_json(row))


@app.route("/api/categories/<int:category_id>", methods=["DELETE"])
@admin_required
def delete_category(category_id):
    if not fetch_one("SELECT ID FROM categories WHERE ID = %s", (category_id,)):
        return error("not_found", 404)
    # delete the stores explicitly, so this works even if the database does not enforce CASCADE
    execute("DELETE FROM stores WHERE category_id = %s", (category_id,))
    execute("DELETE FROM categories WHERE ID = %s", (category_id,))
    return jsonify({"deleted": category_id})


# ---------------------------------------------------------------- admin: stores
@app.route("/api/categories/<int:category_id>/stores", methods=["POST"])
@admin_required
def create_store(category_id):
    if not fetch_one("SELECT ID FROM categories WHERE ID = %s", (category_id,)):
        return error("not_found", 404)

    data = request.get_json(silent=True) or {}
    name = text(data.get("name"), 255)
    url = text(data.get("url"), 500)
    logo = text(data.get("logo"), 500)
    if not name:
        return error("name_required", 400)
    if not valid_url(url):
        return error("invalid_url", 400)
    if logo and not valid_url(logo):
        return error("invalid_logo", 400)

    new_id = execute(
        "INSERT INTO stores (category_id, name, url, logo_url, phone, address, description) "
        "VALUES (%s, %s, %s, %s, %s, %s, %s)",
        (category_id, name, url, logo, text(data.get("phone"), 255),
         text(data.get("address"), 255), text(data.get("description"), 2000)))
    row = fetch_one(f"SELECT {STORE_COLUMNS} FROM stores WHERE ID = %s", (new_id,))
    return jsonify(store_json(row)), 201


@app.route("/api/stores/<int:store_id>", methods=["PUT"])
@admin_required
def update_store(store_id):
    current = fetch_one(f"SELECT {STORE_COLUMNS} FROM stores WHERE ID = %s", (store_id,))
    if not current:
        return error("not_found", 404)

    data = request.get_json(silent=True) or {}
    name = text(data.get("name"), 255) or current["name"]
    url = text(data.get("url"), 500) or current["url"]
    logo = text(data["logo"], 500) if "logo" in data else (current["logo"] or "")
    if not valid_url(url):
        return error("invalid_url", 400)
    if logo and not valid_url(logo):
        return error("invalid_logo", 400)

    def pick(key, n):
        return text(data[key], n) if key in data else (current[key] or "")

    execute(
        "UPDATE stores SET name=%s, url=%s, logo_url=%s, phone=%s, address=%s, description=%s WHERE ID=%s",
        (name, url, logo, pick("phone", 255), pick("address", 255), pick("description", 2000), store_id))
    row = fetch_one(f"SELECT {STORE_COLUMNS} FROM stores WHERE ID = %s", (store_id,))
    return jsonify(store_json(row))


@app.route("/api/stores/<int:store_id>", methods=["DELETE"])
@admin_required
def delete_store(store_id):
    if not fetch_one("SELECT ID FROM stores WHERE ID = %s", (store_id,)):
        return error("not_found", 404)
    execute("DELETE FROM stores WHERE ID = %s", (store_id,))
    return jsonify({"deleted": store_id})


if __name__ == "__main__":
    app.run(debug=True)
