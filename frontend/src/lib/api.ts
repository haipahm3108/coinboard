const BASE = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/+$/, "");

export type Ping = { ok: boolean; service: string; message: string };

export type CoinMarket = {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  price_change_percentage_24h: number | null;
};

export type MarketChart = { prices: [number, number][] };

async function jsonOrThrow(res: Response) {
  const txt = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${txt.slice(0, 200)}`);
  return JSON.parse(txt || "{}");
}

export async function getPing(): Promise<Ping> {
  const url = `${BASE}/api/ping`;
  console.log("getPing ->", url);
  return fetch(url).then(jsonOrThrow);
}

export async function getMarkets(ids?: string[]): Promise<CoinMarket[]> {
  const q = ids?.length ? `?ids=${encodeURIComponent(ids.join(","))}` : "";
  const url = `${BASE}/api/coins${q}`;
  console.log("getMarkets ->", url);
  return fetch(url).then(jsonOrThrow);
}

export async function getChart(cgId: string, days: number): Promise<MarketChart> {
  const url = `${BASE}/api/coins/${encodeURIComponent(cgId)}/chart?days=${encodeURIComponent(
    String(days)
  )}`;
  console.log("getChart ->", { url, cgId, days });
  return fetch(url).then(jsonOrThrow);
}

export type NewsItem = { title: string; link: string; published: number; source: string; summary?: string; };

export async function getNews(coins?: string[]): Promise<NewsItem[]> {
  const q = coins?.length ? `?coins=${encodeURIComponent(coins.join(","))}` : "";
  const url = `${BASE}/api/news${q}`;
  return fetch(url).then(jsonOrThrow);
}

// sever-side watchlist 
export async function getServerWatchlist(accessToken: string): Promise<string[]> {
  const r = await fetch(`${BASE}/api/me/watchlist`, {
    headers: {
     Authorization: `Bearer ${accessToken}`,
    },
  });
  return jsonOrThrow(r);
}
export async function addServerWatch(cgId: string, accessToken: string) {
  const r = await fetch(`${BASE}/api/me/watchlist`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ cg_id: cgId }),
  });
  return jsonOrThrow(r);
}
export async function delServerWatch(cgId: string, accessToken: string) {
 let r = await fetch(`${BASE}/api/me/watchlist/${encodeURIComponent(cgId)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  // if your backend actually expects a query param, fall back
  if (r.status === 404) {
    r = await fetch(`${BASE}/api/me/watchlist?cg_id=${encodeURIComponent(cgId)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  }
  return jsonOrThrow(r);
}