from getpass import getpass
from werkzeug.security import generate_password_hash
from db import get_connection

email = input("Admin email: ").strip()
password = getpass("Admin password (hidden while typing): ")

if not email or not password:
    raise SystemExit("Email and password are required.")

db = get_connection()
with db.cursor() as cur:
    cur.execute("SELECT ID FROM admin WHERE email = %s", (email,))
    if cur.fetchone():
        cur.execute("UPDATE admin SET password_hash = %s WHERE email = %s",
                    (generate_password_hash(password), email))
        print("password updated")
    else:
        cur.execute("INSERT INTO admin (email, password_hash) VALUES (%s, %s)",
                    (email, generate_password_hash(password)))
        print("admin created")
db.commit()
db.close()
