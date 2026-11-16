import os
import pymysql
import certifi
from dotenv import load_dotenv

load_dotenv()


def get_connection():
    # Some hosted databases (for example TiDB Cloud) require an encrypted connection.
    # Set DB_SSL=true to turn it on.
    ssl = {"ca": certifi.where()} if os.getenv("DB_SSL", "").lower() == "true" else None
    return pymysql.connect(
        host=os.getenv("DB_HOST"),
        port=int(os.getenv("DB_PORT", "3306")),   # hosting providers often use another port
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME"),
        ssl=ssl,
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
    )
