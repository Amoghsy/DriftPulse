import os
import psycopg2
from psycopg2.extras import RealDictCursor
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

# Standardize postgres:// to postgresql:// for SQLAlchemy / psycopg2 compatibility
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)


class PostgresConnection:
    """Pure PostgreSQL Database Connection Wrapper using psycopg2"""
    def __init__(self):
        try:
            if os.getenv("DATABASE_URL"):
                self.conn = psycopg2.connect(dsn=DATABASE_URL, connect_timeout=10)
            else:
                self.conn = psycopg2.connect(
                    dbname=POSTGRES_DB,
                    user=POSTGRES_USER,
                    password=POSTGRES_PASSWORD,
                    host=POSTGRES_HOST,
                    port=POSTGRES_PORT,
                    connect_timeout=10
                )
            self.cursor_obj = self.conn.cursor(cursor_factory=RealDictCursor)
        except Exception as e:
            raise RuntimeError(
                f"❌ Failed to connect to PostgreSQL database: {str(e)}.\n"
                f"Please ensure PostgreSQL is running and set DATABASE_URL or POSTGRES_* environment variables."
            ) from e

    def cursor(self):
        return self

    def execute(self, sql, params=()):
        # Convert SQLite ? parameters to PostgreSQL %s
        clean_sql = sql.replace("?", "%s")
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
    return PostgresConnection()


def init_db():
    try:
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
            conn.execute("INSERT INTO users VALUES (%s, %s, %s, %s)", ('local-admin', 'admin@driftpulse.io', 'admin123', 'Security Lead'))
            conn.execute("INSERT INTO users VALUES (%s, %s, %s, %s)", ('local-user', 'user@driftpulse.io', 'password', 'Operator'))
            conn.commit()

        conn.close()
        print("✅ PostgreSQL Database initialized successfully.")
    except Exception as e:
        print(f"⚠️ Database initialization skipped/failed: {str(e)}")


if __name__ == "__main__":
    init_db()
