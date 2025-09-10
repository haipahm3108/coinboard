from fastapi import APIRouter, HTTPException, Query
import httpx, os, time
from dataclasses import dataclass
from typing import  Optional,Any


router = APIRouter()
CG_API_KEY = os.getenv("COINGECKO_API_KEY", "").strip()
BASE = "https://api.coingecko.com/api/v3"
HEADERS = {"x-cg-demo-api-key": CG_API_KEY} if CG_API_KEY else {}


# TTL cache creation -> Pls check on this later to trully understand future me
@dataclass
class Entry:
    ts: float
    data: any


class TTLCache:
    def __init__(self)->None:
        self._store: dict[tuple, Entry] = {}

    
    def get(self, key: tuple, ttl_seconds: int) -> Optional[Any]:
        e = self._store.get(key)
        if not e:
            return None
        if time.time() - e.ts < ttl_seconds:
            return e.data
        #expired
        self._store.pop(key, None)
        return None
    

    def set(self, key: tuple, data: Any) -> None:
        self._store[key] = Entry(time.time(),data)

    
    def clear(self) -> None:
        self._store.clear()
    

    def key(self) -> list[tuple]:
        return list(self._store.key())
    


# Varible of cache for each data
CHART_CACHE = TTLCache()
MARKETS_CACHE = TTLCache()

# Tunable TTLs
CHART_TTL = 300
MARKETS_TTL = 60


# Fetch the chart
async def fetch_market_chart(cg_id: str, days: int) -> dict:
    async with httpx.AsyncClient(timeout=httpx.Timeout(10, connect=5)) as c:
         r = await c.get(
            f"{BASE}/coins/{cg_id}/market_chart",
            params={"vs_currency": "usd", "days": days},
            headers=HEADERS,
        )
    if r.status_code != 200:
        raise HTTPException(status_code=r.status_code, detail=r.text)
    return r.json()


async def fetch_market_chart_range(cg_id: str, days: int) -> dict:
    now = int(time.time())
    frm = now - days * 86400
    async with httpx.AsyncClient(timeout=httpx.Timeout(10, connect=5)) as c:
        r = await c.get(
            f"{BASE}/coins/{cg_id}/market_chart/range",
            params={"vs_currency": "usd", "from": frm, "to": now},
            headers=HEADERS,
        )
    
    if r.status_code != 200:
        raise HTTPException(status_code=r.status_code, detail=r.text)
    return r.json()


# Fetch the market list
@router.get("")
async def fetch_markets(ids_csv: Optional[str] = Query(None), 
                        page: int = Query(1, ge=1), 
                        per_page: int = Query(15, ge=1, le=250)) -> list[dict]:
    
    params = {
        "vs_currency": "usd",
        "order": "market_cap_desc",
        "per_page": per_page,
        "page": page,
        "sparkline": "false",
        "price_change_percentage": "24h",
        }
    
    if ids_csv:
        params["ids"] = ids_csv
    
    async with httpx.AsyncClient(timeout=httpx.Timeout(10, connect=5)) as c:
        r = await c.get(f"{BASE}/coins/markets", params=params, headers=HEADERS)
    if r.status_code != 200:
        raise HTTPException(status_code=r.status_code, detail=r.text)
    return r.json()


# Chart endpoint (cached) -> Pls check on this later to trully understand future me
@router.get("/{cg_id}/chart")
async def chart(
    cg_id: str,
    days: int = Query(7, ge=1, le=365), 
    # /chart?days=7&flush=1 → clear chart cache 
    # -> Pls check on this later to trully understand future me
    flush: bool = False,
    ):
    if flush:
        CHART_CACHE.clear()    
    key = (cg_id, int(days))
    cached = CHART_CACHE.get(key, CHART_TTL)
    if cached is not None:
        return cached

    # Fetch fresh -> Pls check on this later to trully understand futufuturetre me
    data = await fetch_market_chart(cg_id, days)
    if not data.get("prices"):
        data = await fetch_market_chart_range(cg_id, days)
    
    # Only cache when
    if data.get("prices"):
        CHART_CACHE.set(key, data)
    return data

# If FE used charts. Use this below route/alias
@router.get("/{cg_id}/charts")
async def charts_alias(
    cg_id: str,
    days: int = Query(7, ge=1, le=365),
    flush: bool = False,
):
    return await chart(cg_id, days, flush)


# Below this is code block use for cache key inspection
@router.get("/_cache")
def cache_status():
    return {
        "chart_keys": CHART_CACHE.key(),
        "markets_keys": MARKETS_CACHE.key(),
        "chart_ttl_s": CHART_TTL,
        "markets_ttl_s": MARKETS_TTL,
    }

