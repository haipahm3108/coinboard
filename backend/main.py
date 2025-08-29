from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import coins,news
import os,time


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
async def print_routes():
    for r in app.router.routes:
        methods = getattr(r, "methods", [])
        path = getattr(r, "path", "")
        print(f"[ROUTE] {methods} {path}")

app.include_router(coins.router, prefix="/api/coins", tags=["coins"])
app.include_router(news.router, prefix="/api/news", tags=["news"])
