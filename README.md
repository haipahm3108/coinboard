![Static Badge](https://img.shields.io/badge/Python-white?logo=python&logoColor=blue) ![Static Badge](https://img.shields.io/badge/npm-white) ![Static Badge](https://img.shields.io/badge/Docker-white?logo=docker&logoColor=blue) ![Static Badge](https://img.shields.io/badge/React-white?logo=react&logoColor=blue) ![Static Badge](https://img.shields.io/badge/FastAPI-white?logo=fastapi&logoColor=green) ![Static Badge](https://img.shields.io/badge/MySQL-white?logo=mysql&logoColor=blue)




# About this project 
A learning project that lets user explore crypto markets, view price charts, read curated crypto news. The project is built to showcase knowledge of full-stack stack (React + FastAPI + MySQL + Docker) and some modern practices (Auth0, API usage, some cahing and scraping).

Why this project exits: I'm building a portfolio piece that solves a real use case-track coins you care about and at the same time demonstrating and practing design with clean architecture, API integration, and production-style packaging via Docker. 

# Table of Contents

1. [Demo.   ](#Demo)
2. [Features.   ](#Features)
3. [Tech stack. ](#Techs-stack)
4. [Architecture.   ](#Architecture)
5. [Quick start (local).    ](#Quick-start)
6. [Quick start (docker).   ](#Quick-start-docker)
7. [Environment variables.  ](#envs)
8. [Auth (Auth0)    ](#Auth0)
9. [Database    ](#Database)
10. [API endpoints    ](#endpoints)


<a name="Demo"></a>
## 1. Demo

Web: http://localhost:5137

API: http://localhost:8000/docs
(FastAPI docs)

<img width="1897" height="962" alt="Screenshot 2025-09-12 at 00 56 07" src="https://github.com/user-attachments/assets/483c3891-276a-43c0-9849-d52c74a653cf" />


<a name="Features"></a>
## 2. Features

<li>✅ Markets: Top coins prices with 24h % change </li>
<li>✅ <strong>Charts</strong>: 1D/7D/30D line charts </li>
<li>✅ <strong>Watchlist</strong>: Star coins when logged. Stared coins stay in user watchlist </li>
<li>✅ <strong>News</strong>: Clean RSS feed(CoinTelegraph, Decrypt) with summaries </li>
<li>✅ <strong>Caching</strong>: Simple TTL caches for CoinGecko + feeds to reduce latency and rate-limit pressure </li>
<li>✅ <strong>Dockerize</strong>: One docker compose up for db, api, and web </li>
<li> 🚧 <strong>Planned</strong>: AWS deployment, NLP for news sentiment </li>
<br>
<strong>How to use</strong>

<li> Open the app, view top markets</li>
<li> Click View chart button to load a coin's chart (1D/7D/30D)</li>
<li> Login to enable watchlist</li>
<li>Toggle star icon ⭐️ on a coin to add/remove it from your watchlist</li>
<li>Clear all coins in watchlist with clear watchlist button</li>
<li>Read News section on Home</li>

<a name="Techs-stack"></a>
## 3. Tech stack.

<li> <strong>Frontend</strong>: React + Vite + Typescript, Recharts and react-query</li>
<li> <strong>Backend</strong>: FastAPI, PyJWT, feedparser, httpx </li>
<li> <strong>Database</strong>: MySQL, aiomysql </li>
<li> <strong>Auth</strong>: Authentication with Auth0 </li>
<li> <strong>Caching</strong>: Simple TTL caches for CoinGecko + feeds to reduce latency and rate-limit pressure </li>
<li> <strong>Infra</strong>: Docker, Nginx, docker-compose </li>


<a name="Architecture"></a>
## 4. Architecture

<img width="913" height="459" alt="image" src="https://github.com/user-attachments/assets/6f143aba-6a7b-4e57-8f9b-19723fd816d9" />


<a name="Quick-start"></a>
## 5. Quick start (local).

**1. Clone**
```bash
git clone <HTTPS/SSH>
cd CryptoMarketCap-Project
```

**2. Backend**
```bash
cd backend
cp .env.example .env    #fill values(6. Environment variables for more)
python -m venv .venv && source .venv/bin/activate   #python virtual env setup
pip install -r requirements.txt
uvicorn main:app --reload --port 8000   #run backend
```
**3. Frontend**
```bash
cd ../frontend
cp .env.example .env    #VITE_ values 
npm ci || npm i
npm run dev   #run frontend
```
**4. MySQL(local & docker)**
* Local: ensure MySQL is running and matches with backend ```.env```
* Docker: ensure port is available when building and not clashing with MySQL
in ```docker-compose``` ``` ${SERVER_PORT_DB:-3307}:3306```


<a name="Quick-start-docker"></a>
## 6. Quick start (docker).
```bash
cp backend/.env.example backend/.env.docker
cp .env.example .env    #root env use for docker-compose
docker compose build
docker compose up
#web: http://localhost:5173 | api:http://localhost:8000
```
> Recomended to install docker desktop for clean ui and easy to check and open port in containers

<a name="#envs"></a>
## 7. Environment variables.
```backend/.env.example```
```bash
#Below this is varible for MySQL Database
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=change_me
DB_PASS=change_me
DB_NAME=crypto_portfolio1

# Allow frontend orgini
CORS_ORIGINS=http://localhost:5173

# This is Auth0 setup (public)
AUTH0_DOMAIN=dev-nqlbwx3nwspba7ep.us.auth0.com
AUTH0_AUDIENCE=https://api.crypto.auth

# Below this is COINGECKO API 
COINGECKO_API_KEY=insert_key_here
```

```frontend/.env.example```
```bash
# MySQL bootstrap (for the mysql:8 container) 
MYSQL_ROOT_PASSWORD=change_me_root
DB_NAME=crypto_portfolio1
DB_USER=app_user
DB_PASS=change_me_app

# map DB container’s 3306 to your host port (avoid clash with local MySQL)
SERVER_PORT_DB=3307

# frontend build-time
VITE_API_URL=http://localhost:8000
# Authentication
VITE_AUTH0_DOMAIN=dev-nqlbwx3nwspba7ep.us.auth0.com
VITE_AUTH0_CLIENT_ID=n9NMR0AwyEhpVVpJ5tZJsWnT1pkfATUL
VITE_AUTH0_AUDIENCE=https://api.crypto.auth
```

<a name="Auth0"></a>
## 8. Auth (Auth0)

In Auth0 Application setting (for Single Page Application):

* Allowed callback URLs: ```http://localhost:5171```
* Allowed logout URLs: ```http://localhost:5171```

In Auth0 API setting :
* Audience: ```https://api.crypto.auth```

Frontend uses ```@auth0/auth0-react```. Backend check Authorization tokens with PyJWT


<a name="Database"></a>
## 9. Database

Dockerized MySQL 8 and init file that create one table ```watchlists``` for my application 
```sql
--../sq/init/001_schema.sql
CREATE DATABASE IF NOT EXISTS crypto_portfolio1
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE crypto_portfolio1;

CREATE TABLE IF NOT EXISTS watchlists (
  auth0_sub VARCHAR(128) NOT NULL,
  cg_id     VARCHAR(64)  NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (auth0_sub, cg_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

```
init SQL runs on first startup of a fresh volume 

If error: 
* Try ```docker compose down -v``` to re-init
* Check your DB_NAME (env mismatch)
<a name="endpoints"></a>
## 10. API endpoints

```-GET     /api/ping``` - Healthcheck 

```-GET     /api/coins``` - List top coins in markets 

```-GET     /api/coins/{cg_id}/chart``` - Charts

```-GET     /api/news``` - News section 
 
```-GET     /api/me/watchlist``` - Watchlist (auth)

```-POST    /api/me/watchlist```  - Add to watchlist (auth)

```-DELETE  /api/me/watchlist``` - Delete in watchlist (auth)







