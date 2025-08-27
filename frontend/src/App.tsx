import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPing, getMarkets, getChart, type CoinMarket, type MarketChart } from "./lib/api";
import MarketsTable from "./components/MarketsTable";
import PriceChart from "./components/PriceCharts";
import { useLocalStorage } from "./hook/useLocalStorage";

export default function App() {
  const ping = useQuery({ queryKey: ["ping"], queryFn: getPing });
   // Watchlist persisted locally
  const [watchlist, setWatchlist] = useLocalStorage<string[]>("watchlist:v1", []);
  const watchSet = useMemo(() => new Set(watchlist), [watchlist]);
  

  
  // Let selection be optional (null at start)
  const [cgId, setCgId] = useState<string | null>(null);
  const [days, setDays] = useState(7);
  const [onlyWatch, setOnlyWatch] = useState(false);

  const toggleWatch = (id:string) =>
    setWatchlist((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      const next = Array.from(s);
      if (!next.length && id === cgId) {
        setCgId("bitcoin");     // fall back to bitcoin if the list empty
      }
      return next;
    });  

  const markets = useQuery<CoinMarket[]>({
    queryKey: ["markets"],
    queryFn: () => getMarkets(),
    staleTime: 60_000,
  });

  const shownItems = useMemo (() => {
    const all = markets.data ?? [];
    return onlyWatch ? all.filter((c) => watchSet.has(c.id)) : all;
  }, [markets.data, onlyWatch, watchSet]); 

  // Derive which coin to chart based on what's visible
  const effectiveCgId = useMemo(() => {
  if (!shownItems.length) return null; // nothing visible -> nothing to chart
  if (cgId && shownItems.some(c => c.id === cgId)) return cgId; // keep explicit selection if still visible
  return shownItems[0].id; // else default to the first visible coin
  }, [cgId, shownItems]);

  const chart = useQuery<MarketChart>({
    queryKey: ["chart", effectiveCgId, days],
    queryFn: () => getChart(effectiveCgId!, days),
    enabled: !!effectiveCgId,
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


      {/* Top controls */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <label>
          <input
            type="checkbox"
            checked={onlyWatch}
            onChange={(e) => setOnlyWatch(e.target.checked)}
          />{" "} Watchlist only ({watchlist.length})
        </label>

        {/* First choosen coin */}
        <button
          disabled={!watchlist.length}
          onClick={() => setCgId(watchlist[0])}
          title="Load chart for first starred coin"
        > Chart first ⭐
        </button>
        {watchlist.length > 0 && (
          <button
          onClick={() => {
          setWatchlist([]);
          // Optional: if you're in Watchlist-only mode, clear selection immediately
          if (onlyWatch) setCgId(null);
          }}
          title="Remove all starred coins"
          style={{ marginLeft: 8 }}
          > Clear watchlist
          </button>
        )}

        <label style={{ marginLeft: "auto" }}>
          Range:&nbsp;
          <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
            <option value={1}>1D</option>
            <option value={7}>7D</option>
            <option value={30}>30D</option>
          </select>
        </label>

        {/* quick raw endpoint link for debug */}
        <a
          href={`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/coins/${cgId}/chart?days=${days}`}
          target="_blank"
          rel="noreferrer"
          style={{ fontSize: 12, opacity: 0.7 }}
        > open raw endpoint
        </a>
      </div>

      {/* Markets */}
      <h2 style={{ marginTop: 16 }}>Markets {onlyWatch && "— Watchlist"}</h2>
      {markets.isLoading && <p>Loading markets…</p>}
      {markets.error && <p style={{ color: "crimson" }}>
        {(markets.error as Error).message}</p>}
      {!markets.isLoading && !markets.error && shownItems.length === 0 && (
        <p style={{ opacity: 0.7 }}>
          {onlyWatch
            ?"Your watchlist is empty. Star some coins with the ★ button."
              :"No markets to show."}
        </p> 
        )}
        {shownItems.length > 0 && (
        <MarketsTable
          items={shownItems}
          selectedId={effectiveCgId ?? undefined}
          onSelect={setCgId}
          onToggleWatch={toggleWatch}
          watchSet={watchSet}
        />
      )}
      

      {/* Chart controls */}
      <hr style={{ margin: "24px 0" }} />
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <strong>Selected:</strong> {effectiveCgId ?? "—"}
        <label>
          &nbsp;Range:&nbsp;
          <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
            <option value={1}>1D</option>
            <option value={7}>7D</option>
            <option value={30}>30D</option>
          </select>
        </label>
        {/* quick debug link */}
        {effectiveCgId && (
          <a
          href={`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/coins/${effectiveCgId}/chart?days=${days}`}
          target="_blank"
          rel="noreferrer"
          style={{ marginLeft: "auto", fontSize: 12, opacity: 0.7 }}
          > open raw endpoint
          </a>
        )}
        </div>
       
      {/* Chart */}
      <div style={{ marginTop: 16 }}>
        {!effectiveCgId && (
          <p style={{ opacity: 0.7 }}>
            {onlyWatch
              ? "Add a coin to your watchlist to see its chart here."
              : "Select a coin to load the chart."}
          </p>
        )}  
        {effectiveCgId && chart.isLoading && <p>Loading chart…</p>}
        {effectiveCgId && chart.error && (
          <p style={{ color: "crimson" }}>{(chart.error as Error).message}</p>
        )}
        {effectiveCgId && (chart.data?.prices?.length ?? 0) > 0 && (
          <PriceChart prices={chart.data!.prices} days={days} />
        )}
        
         
      </div>
    </div>
  );
}
