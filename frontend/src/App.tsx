import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPing, getMarkets, getChart, type CoinMarket, type MarketChart } from "./lib/api";
import MarketsTable from "./components/MarketsTable";
import PriceChart from "./components/PriceCharts";

export default function App() {
  const [cgId, setCgId] = useState("bitcoin");
  const [days, setDays] = useState(7);

  const ping = useQuery({ queryKey: ["ping"], queryFn: getPing });

  const markets = useQuery<CoinMarket[]>({
    queryKey: ["markets"],
    queryFn: () => getMarkets(),
    staleTime: 60_000,
  });

  const chart = useQuery<MarketChart>({
    queryKey: ["chart", cgId, days],
    queryFn: () => getChart(cgId, days),
    staleTime: 60_000,
  });

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: 24 }}>
      <h1>Crypto Portfolio (Warm-up)</h1>

      {/* Ping (optional) */}
      <div style={{ marginBottom: 12 }}>
        <button onClick={() => ping.refetch()} disabled={ping.isFetching}>
          {ping.isFetching ? "Checking..." : "Check /api/ping"}
        </button>
        {ping.error && <span style={{ color: "crimson", marginLeft: 8 }}>
          {(ping.error as Error).message}
        </span>}
        {ping.data && <span style={{ marginLeft: 8, opacity: .7 }}>
          {ping.data.message}
        </span>}
      </div>

      {/* Markets */}
      <h2>Top Markets</h2>
      {markets.isLoading && <p>Loading markets…</p>}
      {markets.error && <p style={{ color: "crimson" }}>
        {(markets.error as Error).message}
      </p>}
      {markets.data && (
        <MarketsTable
          items={markets.data}
          selectedId={cgId}
          onSelect={setCgId}
        />
      )}

      {/* Chart controls */}
      <hr style={{ margin: "24px 0" }} />
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <strong>Selected:</strong> {cgId}
        <label>
          &nbsp;Range:&nbsp;
          <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
            <option value={1}>1D</option>
            <option value={7}>7D</option>
            <option value={30}>30D</option>
          </select>
        </label>
        {/* quick debug link */}
        <a
          href={`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/coins/${cgId}/chart?days=${days}`}
          target="_blank"
          rel="noreferrer"
          style={{ marginLeft: "auto", fontSize: 12, opacity: 0.7 }}
        >
          open raw endpoint
        </a>
      </div>

      {/* Chart */}
      <div style={{ marginTop: 16 }}>
        {chart.isLoading && <p>Loading chart…</p>}
        {chart.error && <p style={{ color: "crimson" }}>
          {(chart.error as Error).message}
        </p>}
        {(chart.data?.prices?.length ?? 0) > 0 && <PriceChart prices={chart.data!.prices} />}
        {chart.data && (chart.data.prices?.length ?? 0) === 0 && (
          <p style={{ opacity: .7 }}>No data points</p>
        )}
      </div>
    </div>
  );
}
