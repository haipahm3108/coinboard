import os, aiomysql, logging
from typing import Any, Sequence

log = logging.getLogger(__name__)

def _env(name: str, default: str | None = None) -> str | None:
    v = os.getenv(name, default)
    return v.strip() if isinstance(v, str) else v

async def init_pool(app):
    socket_path = _env("DB_UNIX_SOCKET")  
    user = _env("DB_USER", "")
    password = _env("DB_PASS", "")
    dbname = _env("DB_NAME", "")

    kwargs = dict(
        user=user,
        password=password,
        db=dbname,
        autocommit=True,
        minsize=1,
        maxsize=5,
        charset="utf8mb4",
    )

    if socket_path:  # UNIX socket mode
        kwargs["unix_socket"] = socket_path
        log.info("MySQL: using UNIX socket %s db=%s", socket_path, dbname)
    else:            # TCP mode
        host = _env("DB_HOST", "127.0.0.1") or "127.0.0.1"
        port_str = _env("DB_PORT", "3306") or "3306"
        try:
            port = int(port_str)
        except Exception:
            raise RuntimeError(f"DB_PORT must be an integer, got {port_str!r}")
        kwargs["host"] = host
        kwargs["port"] = port
        log.info("MySQL: using TCP %s:%d db=%s", host, port, dbname)

    app.state.db = await aiomysql.create_pool(**kwargs)

async def close_pool(app):
    pool = getattr(app.state, "db", None)
    if pool:
        pool.close()
        await pool.wait_closed()

async def fetch_all(app, sql: str, params: Sequence[Any] = ()):
    pool = app.state.db
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute(sql, params)
            return await cur.fetchall()

async def execute(app, sql: str, params: Sequence[Any] = ()):
    pool = app.state.db
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(sql, params)
