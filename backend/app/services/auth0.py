import os
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt

AUTH0_DOMAIN = os.getenv("AUTH0_DOMAIN", "dev-nqlbwx3nwspba7ep.us.auth0.com")
AUTH0_AUDIENCE = os.getenv("AUTH0_AUDIENCE", "https://api.crypto.auth")
ALGORITHMS = ["RS256"]

if not AUTH0_DOMAIN or not AUTH0_DOMAIN:
    raise RuntimeError("AUTH0_DOMAIN and AUTH0_AUDIENCE must be set")

JWS_URL = f"https://{AUTH0_DOMAIN}/.well-known/jwks.json"
_jws_client = jwt.PyJWKClient(JWS_URL)

bearer = HTTPBearer(auto_error=False)

async def get_current_sub(cred: HTTPAuthorizationCredentials = Depends(bearer)) -> str:
    if not cred or cred.scheme.lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, details="Missing token")
    token = cred.credentials
    try:
        singing_key = _jws_client.get_signing_key_from_jwt(token).key
        payload = jwt.decode(
            token,
            singing_key,
            algorithms = ALGORITHMS,
            audience =  AUTH0_AUDIENCE,
            isuser = f"https:/{AUTH0_DOMAIN}/",
        )
        return str(payload["sub"])
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid/expired token")
    

