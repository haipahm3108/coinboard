from fastapi import APIRouter, HTTPException, Query
import httpx, os, time
from dataclasses import dataclass
from typing import Dict, Tuple, Optional,Any,List

router = APIRouter()

BASE = "https://api.coingecko.com/api/v3"
KEY  = os.getenv("CG_API_KEY_REDACTED")
_CHART_CACHE: dict[tuple[str,int], tuple[float,dict]] = {}
_HEADERS = {"CG_API_KEY_REDACTED": KEY} if KEY else {}
CHART_TTL = 300

# Market chart -----
async def fetch_chart(cg_id:str, days:int)->dict:
    
    async with httpx.AsyncClient(timeout=httpx.Timeout(10, connect=5)) as c:
        r = await c.get(
            f"{BASE}/coins/{cg_id}/market_chart",
            params={"vs_currency": "usd", "days": days},
            headers=_HEADERS,
        )
        
    if r.status_code != 200:
        raise HTTPException(r.status_code, r.text)
    return r.json()


async def get_chart(cg_id: str, days: int) -> dict:
    now = int(time.time())
    frm = now - days * 86400
    async with httpx.AsyncClient(timeout=httpx.Timeout(10, connect=5)) as c:
        r = await c.get(
            f"{BASE}/coins/{cg_id}/market_chart/range",
            params={"vs_currency": "usd", "from": frm, "to": now},
            headers=_HEADERS,
        )
    if r.status_code != 200:
        raise HTTPException(status_code=r.status_code, detail=r.text)
    return r.json()


@router.get("/{cg_id}/charts")
async def charts_alias(cg_id: str, days: int = Query(7, ge=1, le=365)):
    return await get_chart(cg_id, days)


@router.get("/{cg_id}/chart")
async def chart(cg_id: str, days: int = Query(7, ge=1, le=365)):
    return await get_chart(cg_id, days)


# Top coins -----
_MARKETS_CACHE: Dict[Tuple[str, int, int], Tuple[float, list]] = {}
MARKETS_TTL = 60
async def _fetch_markets(ids_csv:Optional[str], page: int, per_page: int)-> list:
    pagrams = {
        "vs_currency": "usd",
        "order": "market_cap_desc",
        "per_page": per_page,
        "page": page,
        "sparkline": "false",
        "price_change_percentage": "24h",
    }
    if ids_csv:
        pagrams["ids"] = ids_csv
    async with httpx.AsyncClient(timeout=10) as c:
        r = await c.get(f"{BASE}/coins/markets",params=pagrams, headers=_HEADERS)
    if r.status_code != 200:
        raise HTTPException(status_code=r.status_code, detail=r.text)
    return r.json()


@router.get("")
async def list_markets(
            ids: Optional[str] = Query(None, description ="Comma-separated CoinGecko ids, e.g. bitcoin,ethereum"),
            page: int = Query(1,ge=1),
            per_page: int = Query(20, ge=1, le=250),
            ):
    key = (ids or "top", page, per_page)
    now = time.time()
    cached = _MARKETS_CACHE.get(key)  
    if cached:
        ts, payload = cached            
        if now - ts < MARKETS_TTL:      
            return payload

    data = await _fetch_markets(ids, page, per_page)
    _MARKETS_CACHE[key] = (key,now)
    return data
