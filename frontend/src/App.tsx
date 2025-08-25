import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPing, getChart, type MarketChart } from "./lib/api";
import { getMarkets, type CoinMarket } from "./lib/api";
import PriceChart from "./components/PriceCharts.tsx";
import MarketsTable from "./components/MarketsTable.tsx";


const COINS = [
  { id: "bitcoin", label: "Bitcoin" },
  { id: "ethereum", label: "Ethereum" },
  { id: "solana", label: "Solana" },
];




export default function App() {
  // ping query (same as before)
  const ping = useQuery({ queryKey: ["ping"], queryFn: getPing });

  // chart state
  const [cgId, setCgId] = useState("bitcoin");
  const [days, setDays] = useState(7);

  const chart = useQuery<MarketChart>({
    queryKey: ["chart", cgId, days],
    queryFn: () => getChart(cgId, days),
    staleTime: 60_000,
  });

  const markets = useQuery<CoinMarket[]>({
  queryKey: ["markets"],
  queryFn: () => getMarkets(), // or getMarkets(["bitcoin","ethereum","solana"])
  staleTime: 60_000,
  });

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: 24 }}>
      <h1>Crypto Portfolio (Warm-up)</h1>

      {/* Ping section */}
      <button onClick={() => ping.refetch()} disabled={ping.isFetching}>
        {ping.isFetching ? "Checking..." : "Check API /api/ping"}
      </button>
      <div style={{ marginTop: 8 }}>
        {ping.isLoading && <p>Loading...</p>}
        {ping.error && <p style={{ color: "crimson" }}>{(ping.error as Error).message}</p>}
        {ping.data && (
          <pre style={{ background: "#111", color: "#0f0", padding: 12, borderRadius: 8 }}>
            {JSON.stringify(ping.data, null, 2)}
          </pre>
        )}
      </div>
      {/* Markets controls */}
      <h2>Top Markets</h2>
      {markets.isLoading && <p>Loading markets…</p>}
      {markets.error && <p style={{ color: "crimson" }}>{(markets.error as Error).message}</p>}
      {markets.data && (
        <MarketsTable
          items={markets.data}
          selectedId={cgId}
          onSelect={(id) => setCgId(id)}   // ⬅️ when click, load that coin’s chart
        />
      )}

      {/* Chart controls */}
      <hr style={{ margin: "24px 0" }} />
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <label>
          Coin:&nbsp;
          <select value={cgId} onChange={(e) => setCgId(e.target.value)}>
            {COINS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </label>
        <label>
          Range:&nbsp;
          <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
            <option value={1}>1D</option>
            <option value={7}>7D</option>
            <option value={30}>30D</option>
          </select>
        </label>
      </div>

      {/* Chart */}
      <div style={{ marginTop: 16 }}>
        {chart.isLoading && <p>Loading chart…</p>}
      {chart.error && <p style={{color:'crimson'}}>Chart error: {(chart.error as Error).message}</p>}
      {(chart.data?.price?.length ?? 0) > 0 && (
      <PriceChart prices={chart.data!.price} />
      )}
      {(chart.data && (chart.data.price?.length ?? 0) === 0) && (
      <p style={{opacity:.7}}>No points from API</p>
      )}
      </div>
    </div>
  );
}

