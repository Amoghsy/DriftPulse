import sqlite3
import os
from datetime import datetime, timedelta

DB_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "database"))
DB_PATH = os.path.join(DB_DIR, "driftpulse.db")

def get_connection():
    os.makedirs(DB_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # Users Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        uid TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL
    )
    """)

    # Devices Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS devices (
        id TEXT PRIMARY KEY,
        ip TEXT NOT NULL,
        type TEXT NOT NULL,
        trust_score REAL NOT NULL,
        drift_score REAL NOT NULL,
        anomaly_score REAL NOT NULL,
        policy TEXT NOT NULL,
        risk TEXT NOT NULL,
        last_seen TEXT NOT NULL,
        location TEXT NOT NULL,
        firmware TEXT NOT NULL,
        uptime TEXT NOT NULL,
        log_count INTEGER DEFAULT 0,
        total_bytes REAL DEFAULT 0
    )
    """)

    # Device History Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS device_history (
        device_id TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        trust_score REAL NOT NULL,
        drift_score REAL NOT NULL,
        anomaly_score REAL NOT NULL,
        PRIMARY KEY (device_id, timestamp)
    )
    """)

    # Alerts Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS alerts (
        id TEXT PRIMARY KEY,
        device_id TEXT NOT NULL,
        type TEXT NOT NULL,
        severity TEXT NOT NULL,
        status TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        resolution_hours REAL NOT NULL
    )
    """)

    conn.commit()

    # Check if we need to seed users
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        cursor.execute("INSERT INTO users VALUES ('local-admin', 'admin@driftpulse.io', 'admin123', 'Security Lead')")
        cursor.execute("INSERT INTO users VALUES ('local-user', 'user@driftpulse.io', 'password', 'Operator')")
        conn.commit()

    # Check if we need to seed devices (skip to keep DB empty until upload)
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully.")
