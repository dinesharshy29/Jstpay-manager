from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

import psycopg
from psycopg.rows import dict_row
from dotenv import load_dotenv
import os

load_dotenv()


@contextmanager
def get_connection() -> Iterator[psycopg.Connection]:
    database_url = os.getenv("DATABASE_URL", "")
    if not database_url:
        raise RuntimeError("DATABASE_URL is not configured")
    with psycopg.connect(database_url, row_factory=dict_row) as connection:
        yield connection


def ensure_schema() -> None:
    schema = Path(__file__).with_name("schema.sql").read_text(encoding="utf-8")
    with get_connection() as connection:
        connection.execute(schema)
        connection.commit()


def get_or_create_identity(firebase_uid: str, email: str | None, display_name: str | None = None) -> dict:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("""
                INSERT INTO users (firebase_uid, email, display_name)
                VALUES (%s, %s, %s)
                ON CONFLICT (firebase_uid) DO UPDATE SET email = EXCLUDED.email, updated_at = NOW()
                RETURNING *
            """, (firebase_uid, email, display_name))
            user = cursor.fetchone()
            cursor.execute("""
                INSERT INTO merchants (user_id, business_name)
                VALUES (%s, %s)
                ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()
                RETURNING *
            """, (user["id"], display_name or ""))
            merchant = cursor.fetchone()
        connection.commit()
    return {"user": user, "merchant": merchant}