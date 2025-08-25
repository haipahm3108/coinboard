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
