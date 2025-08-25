const API_URL = import.meta.env.VITE_API_URL || "http://localhostL:8000" ;

export type Ping = {ok:boolean; service:string; message:string};

export type CoinMarket = {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  price_change_percentage_24h: number | null;
};


export async function getMarkets(ids?: string[]): Promise<CoinMarket[]> {
  const q = ids && ids.length ? `?ids=${ids.join(",")}` : "";
  const res = await fetch(`${API_URL}/api/coins${q}`);
  if (!res.ok) throw new Error(`Markets failed: ${res.status}`);
  return res.json();
}

export async function getPing(): Promise<Ping> {
    const res = await fetch(`${API_URL}/api/ping`);
    if (!res.ok) throw new Error(`Ping failed: ${res.status}`);
    return res.json()   
}

export type MarketChart = {price: [number,number][]};

//export async function getChart(cgId: string, days: number): Promise<MarketChart> {
//    const res = await fetch(`${API_URL}/api/coins/${cgId}/chart?days=${days}`);
//    if (!res.ok) throw new Error(`Chart failed: ${res.status}`);
//    return res.json();
//}
const BASE =
  (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/+$/, "");

export async function getChart(cgId: string, days: number): Promise<MarketChart> {
  const url = `${BASE}/api/coins/${encodeURIComponent(cgId)}/chart?days=${encodeURIComponent(
    String(days)
  )}`;
  console.log("getChart ->", { url, cgId, days }); // DEBUG
  const res = await fetch(url);
  const text = await res.text(); // read body once
  if (!res.ok) {
    // include server message to see *why* it 404'd
    throw new Error(`Chart failed: ${res.status} ${text.slice(0, 200)}`);
  }
  return JSON.parse(text);
}