import { useEffect,useMemo, useState } from "react";
import { useQuery,useQueryClient, useMutation } from "@tanstack/react-query";
import {  getNews,
  type NewsItem,
  type CoinMarket, 
  type MarketChart,
  getPing, getMarkets, getChart,
  getServerWatchlist, addServerWatch, delServerWatch } from "./lib/api";
import MarketsTable from "./components/MarketsTable";
import PriceChart from "./components/PriceCharts";
import { useLocalStorage } from "./hook/useLocalStorage";
import Newslist from "./components/NewsList";
//import { getNews, type NewsItem } from "./lib/api";
import Navbar from "./components/Navbar";
import { useAuth0 } from "@auth0/auth0-react";






export default function App() {
  const qc = useQueryClient();
  
  // auth
  const { isAuthenticated, user, loginWithRedirect, logout, getAccessTokenSilently } = useAuth0();
  

   // Watchlist persisted locally
  const [watchlist, setWatchlist]= useLocalStorage<string[]>("watchlist:v1", []);
  const watchSet = useMemo(() => new Set(watchlist), [watchlist]);
  
  // Primary persisted locally
  const [primary, setPrimary]= useLocalStorage<string[]>("primary:v1", []);
  const primaryFiltered= useMemo(
  () => primary.filter(id => watchSet.has(id)),
  [primary, watchSet]
  );
  //const primarySet = useMemo(() => new Set(primaryFiltered), [primaryFiltered]);

  
  // view state ui
  const [onlyWatch, setOnlyWatch] = useState(false);    // Watchlist tab
  const [cgId, setCgId] = useState("bitcoin");
  const [days, setDays] = useState(7);
  
  /*
  const [cgId, setCgId] = useState<string | null>(null);
  const [days, setDays] = useState(7);
  const [onlyWatch, setOnlyWatch] = useState(false);
  */
  // Bbounce out of watchlist if logged out
  // if logged out while on watchlist tab, go home
  useEffect(() => { if (!isAuthenticated && onlyWatch) setOnlyWatch(false); }, [isAuthenticated, onlyWatch]);
  const ping = useQuery({ queryKey: ["ping"], queryFn: getPing });
  
  

  //const togglePrimary = (id: string) => {
  //// add/remove from ordered primary list
  //  setPrimary(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [id, ...prev.filter(x => x !== id)]));
  //// ensure it's starred when pinned
  //  setWatchlist(prev => (prev.includes(id) ? prev : [id, ...prev]));
  // };
  

  const markets = useQuery<CoinMarket[]>({
    queryKey: ["markets"],
    queryFn: () => getMarkets(),
    staleTime: 60_000,
  });

  const shownItems = useMemo (() => {
    const all = markets.data ?? [];
    return onlyWatch ? all.filter((c) => watchSet.has(c.id)) : all;
  }, [markets.data, onlyWatch, watchSet]); 

const clearWatchlist = async () => {
  if (isAuthenticated && watchlist.length) {
    const token = await getAccessTokenSilently({
      authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE },
    });
    await Promise.all(watchlist.map(id => delServerWatch(id, token)));
    qc.invalidateQueries({ queryKey: ["serverWatchlist"] });
  }
  setWatchlist([]);
  setPrimary([]);
  if (onlyWatch) setCgId("bitcoin");
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
  
  // Server watchlist (only when logged in)
  const serverWatchlist = useQuery<string[]>({
    queryKey: ["serverWatchlist"],
    enabled: isAuthenticated,
    queryFn: async () => {
      const token = await getAccessTokenSilently({
        authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE },
      });
      return getServerWatchlist(token);
    },
    initialData: [],
  });
  // toggle ⭐ (require login)
  const toggleWatch = useMutation({
    mutationFn: async (id: string) => {
      if (!isAuthenticated) {
        await loginWithRedirect();
        return;
      }
      const token = await getAccessTokenSilently();
      if (watchSet.has(id)) await delServerWatch(id, token);
      else await addServerWatch(id, token);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["serverWatchlist"] }),
  });
  // Navbar handlers
  const handleNav = async (tab: "home" | "watchlist") => {
    if (tab === "home") { setOnlyWatch(false); return; }
    if (!isAuthenticated) { await loginWithRedirect(); return; }
    setOnlyWatch(true);
  };


// 🔄 sync server → local after login (prevents “stars” mismatch)
  useEffect(() => {
    if (isAuthenticated && serverWatchlist.data) {
      // only update if different to avoid needless re-renders
      const server = serverWatchlist.data;
      if (server.length !== watchlist.length || server.some((id, i) => id !== watchlist[i])) {
        setWatchlist(server);
      }
    }
  }, [isAuthenticated, serverWatchlist.data, watchlist, setWatchlist]);
  const handleLogin = () => loginWithRedirect();
  const handleLogout = async () => {
  // 1) clear client state
  setWatchlist([]);
  setPrimary([]);
  setOnlyWatch(false);
  setCgId("bitcoin");

  // 2) clear react-query cache for server list
  qc.removeQueries({ queryKey: ["serverWatchlist"] });

  // 3) clear localStorage keys used by your hooks (belt & suspenders)
  localStorage.removeItem("watchlist:v1");
  localStorage.removeItem("primary:v1");

  // 4) redirect to Auth0 logout
  await logout({ logoutParams: { returnTo: window.location.origin } });
};


  return (
    
  <>
    {/* Top controls */}
    <Navbar style={{ fontFamily: "system-ui, serif", padding: 24 }}
        current={onlyWatch ? "watchlist" : "home"}
        onNav={handleNav}
        onLogin={handleLogin}
        onLogout={handleLogout}  
        userEmail={user?.email ?? null}
    />
    <div style={{ fontFamily: "system-ui, serif", padding: 24 }}>

     
      <h1>Crypto Portfolio (Warm-up)</h1>

      {/* Ping (optional) */}
      <div style={{ marginBottom: 12 }}>
        <button onClick={() => ping.refetch()} disabled={ping.isFetching}>
          {ping.isFetching ? "Checking..." : "Check /api/ping"}
        </button>
        {ping.error && <span style={{ color: "csrimson", marginLeft: 8 }}>
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
          <button onClick={clearWatchlist} style={{ marginBottom: 24 }}
          > Clear watchlist
          </button>
       )}
        {shownItems.length > 0 && (
        <MarketsTable
          items={shownItems}
          //onLogin={handleLogin}
          //onLogout={handleLogout}
          selectedId={cgId}
          onSelect={setCgId}
          onToggleWatch={(id) => toggleWatch.mutate(id)}
          showPrimaryControls={false}            // keep off for now
          onTogglePrimary={undefined}
          primarySet={new Set<string>()}
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
