"""Shared database connection and idempotent-upsert helpers for ingestion jobs."""

import os
import logging
import psycopg2
from urllib.parse import urlparse

logger = logging.getLogger("ingestion")


def get_connection():
    """Create and return a new PostgreSQL connection based on environment variables."""
    db_url = os.environ.get("DATABASE_URL")
    if db_url:
        result = urlparse(db_url)
        return psycopg2.connect(
            dbname=result.path[1:],
            user=result.username,
            password=result.password,
            host=result.hostname,
            port=result.port or 5432,
        )
    return psycopg2.connect(
        dbname=os.environ.get("POSTGRES_DB", "charter_db"),
        user=os.environ.get("POSTGRES_USER", "charter_user"),
        password=os.environ.get("POSTGRES_PASSWORD", "charter_pass"),
        host=os.environ.get("POSTGRES_HOST", "localhost"),
        port=int(os.environ.get("POSTGRES_PORT", 5432)),
    )


def insert_freight_index_records(records, conn=None):
    """
    Idempotent insert of freight index records.
    records: list of dicts with keys: index_name, date, value, data_provenance, source
    Returns number of newly inserted rows.
    """
    if not records:
        return 0

    should_close = False
    if conn is None:
        conn = get_connection()
        should_close = True

    query = """
        INSERT INTO freight_index_series (index_name, date, value, data_provenance, source)
        SELECT %(index_name)s, %(date)s, %(value)s, %(data_provenance)s, %(source)s
        WHERE NOT EXISTS (
            SELECT 1 FROM freight_index_series
            WHERE index_name = %(index_name)s AND date = %(date)s
        );
    """
    try:
        inserted = 0
        with conn.cursor() as cur:
            for r in records:
                # Validation of required non-null fields
                if not r.get("data_provenance"):
                    raise ValueError(f"Missing data_provenance in record: {r}")
                if not r.get("source"):
                    raise ValueError(f"Missing source in record: {r}")
                if r.get("value") is None:
                    continue

                cur.execute(query, r)
                inserted += cur.rowcount
            conn.commit()
        return inserted
    finally:
        if should_close:
            conn.close()


def insert_bunker_price_records(records, conn=None):
    """
    Idempotent insert of bunker price records.
    records: list of dicts with keys: date, value, data_provenance, source
    Returns number of newly inserted rows.
    """
    if not records:
        return 0

    should_close = False
    if conn is None:
        conn = get_connection()
        should_close = True

    query = """
        INSERT INTO bunker_price_series (date, value, data_provenance, source)
        SELECT %(date)s, %(value)s, %(data_provenance)s, %(source)s
        WHERE NOT EXISTS (
            SELECT 1 FROM bunker_price_series
            WHERE date = %(date)s AND source = %(source)s
        );
    """
    try:
        inserted = 0
        with conn.cursor() as cur:
            for r in records:
                if not r.get("data_provenance"):
                    raise ValueError(f"Missing data_provenance in record: {r}")
                if not r.get("source"):
                    raise ValueError(f"Missing source in record: {r}")
                if r.get("value") is None:
                    continue

                cur.execute(query, r)
                inserted += cur.rowcount
            conn.commit()
        return inserted
    finally:
        if should_close:
            conn.close()


def insert_fx_rate_records(records, conn=None):
    """
    Idempotent insert of FX rate records.
    records: list of dicts with keys: date, pair, value, data_provenance, source
    Returns number of newly inserted rows.
    """
    if not records:
        return 0

    should_close = False
    if conn is None:
        conn = get_connection()
        should_close = True

    query = """
        INSERT INTO fx_rate_series (date, pair, value, data_provenance, source)
        SELECT %(date)s, %(pair)s, %(value)s, %(data_provenance)s, %(source)s
        WHERE NOT EXISTS (
            SELECT 1 FROM fx_rate_series
            WHERE pair = %(pair)s AND date = %(date)s
        );
    """
    try:
        inserted = 0
        with conn.cursor() as cur:
            for r in records:
                if not r.get("data_provenance"):
                    raise ValueError(f"Missing data_provenance in record: {r}")
                if not r.get("source"):
                    raise ValueError(f"Missing source in record: {r}")
                if r.get("value") is None:
                    continue

                cur.execute(query, r)
                inserted += cur.rowcount
            conn.commit()
        return inserted
    finally:
        if should_close:
            conn.close()
