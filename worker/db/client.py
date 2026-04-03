from contextlib import contextmanager
from typing import Generator, LiteralString

import psycopg
from psycopg import sql
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool
from config import config


class Database:
    def __init__(self):
        self.dsn = config.DATABASE_URL

        if not self.dsn:
            raise ValueError("DATABASE_URL is not set")

        self.pool = ConnectionPool(
            conninfo=self.dsn,
            min_size=1,
            max_size=10,
            kwargs={
                "autocommit": False,
                "row_factory": dict_row,  # returns dict rows
            },
        )

    @contextmanager
    def connection(self) -> Generator[psycopg.Connection, None, None]:
        with self.pool.connection() as conn:
            try:
                yield conn
            finally:
                pass  # pool handles release

    @contextmanager
    def transaction(self) -> Generator[psycopg.Connection, None, None]:
        with self.pool.connection() as conn:
            try:
                yield conn
                conn.commit()
            except Exception:
                conn.rollback()
                raise

    def execute(self, query: LiteralString, params=None):
        with self.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(sql.SQL(query), params)

    def fetch_one(self, query: LiteralString, params=None):
        with self.connection() as conn:
            with conn.cursor() as cur:
                cur.execute(sql.SQL(query), params)
                return cur.fetchone()

    def fetch_all(self, query: LiteralString, params=None):
        with self.connection() as conn:
            with conn.cursor() as cur:
                cur.execute(sql.SQL(query), params)
                return cur.fetchall()

    def close(self):
        self.pool.close()
