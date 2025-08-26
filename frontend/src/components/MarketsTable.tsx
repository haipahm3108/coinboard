import type { CoinMarket } from "../lib/api";

type Props = {
  items: CoinMarket[];          // the array to render
  selectedId?: string;          // current selected coin id (to highlight)
  onSelect: (id: string) => void; // called when “View chart” is clicked
  onToggleWatch: (id: string) => void;
  watchSet: Set<string>;
};


const fmtPrice = (n: number) =>
  n.toLocaleString(undefined, { style: "currency", currency: "USD" });

const fmtPct = (n: number | null) =>
  n == null ? "—" : `${n.toFixed(2)}%`;

export default function MarketsTable({ items, 
                                      selectedId, 
                                      onSelect,
                                      onToggleWatch,
                                      watchSet,}: Props) {
  if (!items.length) return <p>No coins found.</p>;

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 560 }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: 8 }}>Coin</th>
            <th style={{ textAlign: "right", padding: 8 }}>Price</th>
            <th style={{ textAlign: "right", padding: 8 }}>24h %</th>
            <th style={{ padding: 8 }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {items.slice(0, 15).map((c) => {
            const active = c.id === selectedId;
            const watched = watchSet.has(c.id);
            return (
              <tr key={c.id} style={{ borderTop: "1px solid #eee", background: active ? "#f6faff" : undefined }}>
                  <td style={{ padding: 8, textAlign: "center" }}>
                  <button
                    onClick={() => onToggleWatch(c.id)}
                    title={watched ? "Remove from watchlist" : "Add to watchlist"}
                    aria-label={watched ? "Unstar" : "Star"}
                    style={{
                      fontSize: 18,
                      lineHeight: 1,
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    {watched ? "★" : "☆"}
                  </button>
                </td>
                <td style={{ padding: 8 }}>
                  <img
                    src={c.image}
                    alt=""
                    width={18}
                    height={18}
                    style={{ verticalAlign: "middle", marginRight: 8 }}
                  />
                  {c.name} ({c.symbol.toUpperCase()})
                </td>
                <td style={{ padding: 8, textAlign: "right" }}>{fmtPrice(c.current_price)}</td>
                <td
                  style={{
                    padding: 8,
                    textAlign: "right",
                    color: (c.price_change_percentage_24h || 0) >= 0 ? "green" : "crimson",
                  }}
                >
                  {fmtPct(c.price_change_percentage_24h)}
                </td>
                <td style={{ padding: 8, textAlign: "center" }}>
                  <button onClick={() => onSelect(c.id)}>
                    {active ? "Selected" : "View chart"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
