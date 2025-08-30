import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPing, getMarkets, getChart, type CoinMarket, type MarketChart } from "./lib/api";
import MarketsTable from "./components/MarketsTable";
import PriceChart from "./components/PriceCharts";
import { useLocalStorage } from "./hook/useLocalStorage";
import Newslist from "./components/NewsList";
import { getNews, type NewsItem } from "./lib/api";
import Navbar from "./components/Navbar";




export default function App() {
  const ping = useQuery({ queryKey: ["ping"], queryFn: getPing });
   // Watchlist persisted locally
  const [watchlist, setWatchlist]= useLocalStorage<string[]>("watchlist:v1", []);
  const watchSet = useMemo(() => new Set(watchlist), [watchlist]);
  
  // Primary persisted locally
  const [primary, setPrimary]= useLocalStorage<string[]>("primary:v1", []);
  const primaryFiltered= useMemo(
  () => primary.filter(id => watchSet.has(id)),
  [primary, watchSet]
  );
  const primarySet = useMemo(() => new Set(primaryFiltered), [primaryFiltered]);

  
  // UI
  const [cgId, setCgId] = useState<string | null>(null);
  const [days, setDays] = useState(7);
  const [onlyWatch, setOnlyWatch] = useState(false);

  const toggleWatch = (id:string) =>
    setWatchlist( prev => {
      const s = new Set(prev);
       if (s.has(id)) {
        s.delete(id);
        // drop from primary if unstarred
        setPrimary(p => p.filter(pid => pid !== id));
      } else {
        s.add(id); 
      }
      const next = Array.from(s);
      if (!next.length && id === cgId) {
        setCgId("bitcoin");     // fall back to bitcoin if the list empty
      }
      return next;
    });  
  
  const togglePrimary = (id: string) => {
    // add/remove from ordered primary list
    setPrimary(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [id, ...prev.filter(x => x !== id)]));
    // ensure it's starred when pinned
    setWatchlist(prev => (prev.includes(id) ? prev : [id, ...prev]));
  };
  

  const markets = useQuery<CoinMarket[]>({
    queryKey: ["markets"],
    queryFn: () => getMarkets(),
    staleTime: 60_000,
  });

  const shownItems = useMemo (() => {
    const all = markets.data ?? [];
    return onlyWatch ? all.filter((c) => watchSet.has(c.id)) : all;
  }, [markets.data, onlyWatch, watchSet]); 

  const clearWatchlist = () => {
  setWatchlist([]);
  setPrimary([]);        
  // optional: if you’re in watchlist mode, clear selection
  if (onlyWatch) setCgId(null);
  };

    // Derive which coin to chart based on what's visible <----- CHECK
  const effectiveCgId = useMemo(() => {
  if (!shownItems.length) return null; // nothing visible -> nothing to chart
  const firstPrimaryVisible = primaryFiltered.find(id => shownItems.some(c => c.id === id)) || null; // keep explicit selection if still visible
  if (cgId && shownItems.some(c => c.id === cgId)) return cgId;
    return firstPrimaryVisible ?? shownItems[0].id;
  }, [cgId, shownItems, primaryFiltered]);

  const chart = useQuery<MarketChart>({
    queryKey: ["chart", effectiveCgId, days],
    queryFn: () => getChart(effectiveCgId!, days),
    enabled: !!effectiveCgId,
    staleTime: 60_000,
  });
  
  //news state
  const [newsCount, setNewsCount] = useState(8);

  const news = useQuery<NewsItem[]> (
    {
      queryKey: ["news", onlyWatch ? watchlist.join(",") : "all"],
      queryFn: () => getNews(onlyWatch ? watchlist : undefined),
      staleTime: 15*60_000,
       enabled: !onlyWatch,
    }
  );
  const allNews = news.data ?? [];
  const visibleNews = useMemo(
    () => allNews.slice(0, Math.max(0, Math.min(newsCount, allNews.length))),
    [allNews, newsCount]
  );
  const hasMoreNews = allNews.length > visibleNews.length;

  return (
    
  <>
    {/* Top controls */}
    <Navbar style={{ fontFamily: "system-ui, serif", padding: 24 }}
      current={onlyWatch ? "watchlist" : "home"}
      onNav={(tab) => setOnlyWatch(tab === "watchlist")}
      onLogin={() => alert("Auth0 coming soon")}
    />
    <div style={{ fontFamily: "system-ui, serif", padding: 24 }}>

     
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

      
      {/* 
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <label>
          <input
            type="checkbox"
            checked={onlyWatch}
            onChange={(e) => setOnlyWatch(e.target.checked)}
          />{" "} Watchlist only ({watchlist.length})
        </label>

      
        
        {/* quick raw endpoint link for debug 
        <a
          href={`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/coins/${cgId}/chart?days=${days}`}
          target="_blank"
          rel="noreferrer"
          style={{ fontSize: 12, opacity: 0.7 }}
        > open raw endpoint
        </a>
      </div>
      */}
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
        {/* clear coins selection */}
        {onlyWatch && (watchlist.length > 0 || primaryFiltered.length > 0) &&  (
          <button onClick={clearWatchlist} style={{ marginLeft: 8 }}
          > Clear watchlist
          </button>
       )}
        {shownItems.length > 0 && (
        <MarketsTable
          items={shownItems}
          selectedId={effectiveCgId ?? undefined}
          onSelect={setCgId}
          onToggleWatch={toggleWatch}
          watchSet={watchSet}
          primarySet={primarySet}
          onTogglePrimary={togglePrimary}
          showPrimaryControls={onlyWatch}      
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
      
      {/**News section */}
      {!onlyWatch && (
      <>
      <h2 style={{ marginTop: 24 }}>News</h2>

      {news.isLoading && <p>Loading news…</p>}
      {news.error && <p style={{ color: "crimson" }}>{(news.error as Error).message}</p>}
      {visibleNews.length > 0 && <Newslist items={visibleNews} layout="pattern" featureEvery={6} />}

      {/* Actions */}
      {visibleNews.length > 0 && (
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 12 }}>
          {hasMoreNews && (
            <button onClick={() => setNewsCount(c => c + 8)}>
              Load more
            </button>
          )}
          {newsCount > 8 && (
            <button onClick={() => setNewsCount(8)}>
              Show less
            </button>
          )}
        </div>
      )}
    </>
  )}
          
    </div>
</>    
  );
}
