from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import coins,news,watchlist
import os,time
from app.db import init_pool, close_pool
from dotenv import load_dotenv

load_dotenv()
app = FastAPI(title = "Crypto Portfolio(Warm-up)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173","http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/ping")
def ping():
    return {"ok":True, "service":"api", "message":"pong"}

@app.get("/api/health")
def health():
    # basic env + time + list a couple routes 
    return {
        "ok": True,
        "time": time.time(),
        "env": {"COINGECKO_DEMO_API_KEY": bool(os.getenv("CG_API_KEY_REDACTED"))},
        "routes_expected": ["/api/coins", "/api/coins/{cg_id}/chart", "/api/ping"],
    }

@app.on_event("startup")
async def _on_start(): await init_pool(app)

@app.on_event("shutdown")
async def _on_stop(): await close_pool(app)


app.include_router(coins.router, prefix="/api/coins", tags=["coins"])
app.include_router(news.router, prefix="/api/news", tags=["news"])
app.include_router(watchlist.router, prefix="/api/me/watchlist", tags=["me"])
