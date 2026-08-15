import os
import sqlite3
from dotenv import load_dotenv

load_dotenv()

# PostgreSQL environment configuration
POSTGRES_USER = os.getenv("POSTGRES_USER", "postgres")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "postgres")
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")
POSTGRES_DB = os.getenv("POSTGRES_DB", "driftpulse")

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
)
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# SQLite fallback path (stored locally in backend/.sqlite_data)
DB_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".sqlite_data"))
DB_PATH = os.path.join(DB_DIR, "driftpulse.db")

USE_POSTGRES = False

try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
    # Attempt connecting to PostgreSQL
    conn_test = psycopg2.connect(
        dbname=POSTGRES_DB,
        user=POSTGRES_USER,
        password=POSTGRES_PASSWORD,
        host=POSTGRES_HOST,
        port=POSTGRES_PORT,
        connect_timeout=3
    )
    conn_test.close()
    USE_POSTGRES = True
    print(f"[OK] Connected to PostgreSQL database ({POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB})")
except Exception as e:
    USE_POSTGRES = False
    print(f"[INFO] PostgreSQL connection info ({str(e).strip()}). Using SQLite fallback at: {DB_PATH}")


class DBConnection:
    """Unified Database Connection Wrapper for PostgreSQL & SQLite compatibility"""
    def __init__(self):
        self.is_postgres = USE_POSTGRES
        if self.is_postgres:
            import psycopg2
            from psycopg2.extras import RealDictCursor
            self.conn = psycopg2.connect(
                dbname=POSTGRES_DB,
                user=POSTGRES_USER,
                password=POSTGRES_PASSWORD,
                host=POSTGRES_HOST,
                port=POSTGRES_PORT
            )
            self.cursor_obj = self.conn.cursor(cursor_factory=RealDictCursor)
        else:
            os.makedirs(DB_DIR, exist_ok=True)
            self.conn = sqlite3.connect(DB_PATH)
            self.conn.row_factory = sqlite3.Row
            self.cursor_obj = self.conn.cursor()

    def cursor(self):
        return self

    def _convert_sql(self, sql):
        if self.is_postgres:
            return sql.replace("?", "%s")
        return sql

    def execute(self, sql, params=()):
        clean_sql = self._convert_sql(sql)
        self.cursor_obj.execute(clean_sql, params)
        return self.cursor_obj

    def fetchone(self):
        res = self.cursor_obj.fetchone()
        if res is None:
            return None
        return dict(res)

    def fetchall(self):
        res = self.cursor_obj.fetchall()
        if not res:
            return []
        return [dict(r) for r in res]

    def commit(self):
        self.conn.commit()

    def close(self):
        try:
            self.cursor_obj.close()
            self.conn.close()
        except Exception:
            pass


def get_connection():
    return DBConnection()


def init_db():
    conn = get_connection()
    
    # Users Table
    conn.execute("""
    CREATE TABLE IF NOT EXISTS users (
        uid VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(255) NOT NULL
    )
    """)

    # Devices Table
    conn.execute("""
    CREATE TABLE IF NOT EXISTS devices (
        id VARCHAR(255) PRIMARY KEY,
        ip VARCHAR(255) NOT NULL,
        type VARCHAR(255) NOT NULL,
        trust_score DOUBLE PRECISION NOT NULL,
        drift_score DOUBLE PRECISION NOT NULL,
        anomaly_score DOUBLE PRECISION NOT NULL,
        policy VARCHAR(255) NOT NULL,
        risk VARCHAR(255) NOT NULL,
        last_seen VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        firmware VARCHAR(255) NOT NULL,
        uptime VARCHAR(255) NOT NULL,
        log_count INTEGER DEFAULT 0,
        total_bytes DOUBLE PRECISION DEFAULT 0
    )
    """)

    # Device History Table
    conn.execute("""
    CREATE TABLE IF NOT EXISTS device_history (
        device_id VARCHAR(255) NOT NULL,
        timestamp VARCHAR(255) NOT NULL,
        trust_score DOUBLE PRECISION NOT NULL,
        drift_score DOUBLE PRECISION NOT NULL,
        anomaly_score DOUBLE PRECISION NOT NULL,
        PRIMARY KEY (device_id, timestamp)
    )
    """)

    # Alerts Table
    conn.execute("""
    CREATE TABLE IF NOT EXISTS alerts (
        id VARCHAR(255) PRIMARY KEY,
        device_id VARCHAR(255) NOT NULL,
        type VARCHAR(255) NOT NULL,
        severity VARCHAR(255) NOT NULL,
        status VARCHAR(255) NOT NULL,
        timestamp VARCHAR(255) NOT NULL,
        resolution_hours DOUBLE PRECISION NOT NULL
    )
    """)

    conn.commit()

    # Seed default admin user if empty
    res = conn.execute("SELECT COUNT(*) as count FROM users").fetchone()
    count = res["count"] if res else 0
    if count == 0:
        conn.execute("INSERT INTO users VALUES (?, ?, ?, ?)", ('local-admin', 'admin@driftpulse.io', 'admin123', 'Security Lead'))
        conn.execute("INSERT INTO users VALUES (?, ?, ?, ?)", ('local-user', 'user@driftpulse.io', 'password', 'Operator'))
        conn.commit()

    conn.close()


if __name__ == "__main__":
    init_db()
    print("Database initialized successfully.")
