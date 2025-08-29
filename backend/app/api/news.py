from fastapi import APIRouter, HTTPException, Query
import httpx, time, feedparser,re, html
from typing import Any, Optional
from dataclasses import dataclass

router = APIRouter()

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
        now = time.monotonic()
        if now - e.ts < ttl_seconds:
            return e.data
        #expired
        self._store.pop(key, None)
        return None

    def set(self, key: tuple, data: Any) -> None:
        self._store[key] = Entry(time.monotonic(),data)
    
    def clear(self) -> None:
        self._store.clear()

    def key(self) -> list[tuple]:
        return list(self._store.key())

    
CACHE = TTLCache()
TTL = 15 * 60
MAX_FEED_BYTES = 1_000_000      # 1MB cap per feed

FEEDS = {
    "CoinDesk":      "https://www.coindesk.com/arc/outboundfeeds/rss/",
    "CoinTelegraph": "https://cointelegraph.com/rss",
    "Decrypt":       "https://decrypt.co/feed",
}

def _excerpt(s: str, limit: int = 240) -> str:
    if len(s) <= limit:
        return s
    cut = s[:limit].rsplit(" ", 1)[0]
    return cut + "…"


def _sanitize_text(s: Optional[str]) -> str:
    s = s or ""
    s = re.sub(r"<[^>]*>", "", s)
    s = html.unescape(s) 
    return s.strip()


async def fetch_feed(name: str, url: str) -> list[dict]:
    async with httpx.AsyncClient (
        timeout= httpx.Timeout(10,connect=5),
        limits= httpx.Limits(max_connections=8, max_keepalive_connections=4),
        headers={"User-Agent": "crypto-portfolio/1.0 (+https://localhost)"},
        follow_redirects=True,
    ) as c : 
        r = await c.get(url)
    if r.status_code != 200:
        raise HTTPException(r.status_code,f"Feed error{name}")
    if len(r.content) > MAX_FEED_BYTES:
        raise HTTPException(413, f"Feed too large: {name}")
    
    parsed = feedparser.parse(r.content)
    items: list[dict] = []
    for e in parsed.entries[:50]:
        title = _sanitize_text(getattr(e, "title", ""))
        link = getattr(e, "link", "")
        pub = getattr(e, "published_parsed", None)
        ts = int(time.mktime(pub)) if pub else int(time.time())
        raw_summary = (
            getattr(e, "summary", None)
            or getattr(e, "description", None)
            or (getattr(e, "content", [{}])[0].get("value") if getattr(e, "content", None) else None)
        )
        summary = _excerpt(_sanitize_text(raw_summary or ""))
        if title and link:
            items.append({"title": title, 
                          "link": link,
                          "published": ts,
                          "source": name,
                          "summary": summary,})
    return items
    

def filter_by_coins(items: list[dict], coins_csv: Optional[str]) -> list[dict]:
    if not coins_csv: return items
    wanted = [s.strip().lower() for s in coins_csv.split(",") if s.strip()]
    if not wanted: return items
    out = []
    for it in items:
        t = it["title"].lower()
        if any(w in t for w in wanted):
            out.append(it)
    return out


@router.get("")
async def list_news(
    coin: Optional[str] = Query(None, description="comma-separated ids, e.g. bitcoin,ethereum"),
    limits: int = Query(20, ge=1, le=200),
    flush: bool = False,
    ):
    key = (coin or "all", int(limits))
    if flush : CACHE.clear()
    cached = CACHE.get(key, TTL)    
    if cached is not None:
        return cached

    all_items: list[dict] = []
    for name, url in FEEDS.items():
        try:
            all_items.extend(await fetch_feed(name, url))
        except:
            continue

    all_items.sort(key=lambda x: x["published"], reverse=True)
    result = filter_by_coins(all_items, coin)[:limits]
    if result:
        CACHE.set(key, result)
    return result


    