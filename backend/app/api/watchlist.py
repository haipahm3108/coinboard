from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from app.db import fetch_all,execute
from app.services.auth0 import get_current_sub

router = APIRouter()

class WatchBody(BaseModel):
    cg_id: str

@router.get("")
async def list_watch(req: Request, sub: str = Depends(get_current_sub)) -> list[str]:
        rows = await fetch_all(req.app, "SELECT cg_id FROM watchlists WHERE auth0_sub=%s ORDER BY created_at DESC", (sub,))
        return [r["cg_id"] for r in rows]

@router.post("")
async def add_watch(req: Request, body: WatchBody, sub: str = Depends(get_current_sub)):
    await execute(req.app, "INSERT IGNORE INTO watchlists(auth0_sub, cg_id) VALUES(%s,%s)", (sub, body.cg_id))
    return {"ok": True}

@router.delete("")
async def del_watch(req: Request, cg_id: str, sub: str = Depends(get_current_sub)):
      await execute(req.app, "DELETE FROM watchlists WHERE auth0_sub=%s AND cg_id=%s", (sub, cg_id))
      return {"ok":True}
     
