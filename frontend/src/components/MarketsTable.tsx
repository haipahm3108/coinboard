// src/components/MarketsTable.tsx
import type { CoinMarket } from "../lib/api";
import styles from "./MarketsTable.module.css";

type Props = {
  items: CoinMarket[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onToggleWatch: (id: string) => void;
  showPrimaryControls?: boolean;
  onTogglePrimary?: (id: string) => void;
  primarySet: Set<string>;
  watchSet: Set<string>;
};

const fmtPrice = (n: number) =>
  n.toLocaleString(undefined, { style: "currency", currency: "USD" });

const fmtPct = (n: number | null) => (n == null ? "—" : `${n.toFixed(2)}%`);

export default function MarketsTable({
  items,
  selectedId,
  onSelect,
  onToggleWatch,
  onTogglePrimary,
  showPrimaryControls = false,
  primarySet,
  watchSet,
}: Props) {
  if (!items.length) return <p className={styles.empty}>No coins found.</p>;

  return (
    <section className={styles.panel}>
      <div className={styles.wrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={`${styles.th} ${styles.starCol}`} />
              {showPrimaryControls && (
                <th className={`${styles.th} ${styles.pinCol}`} />
              )}
              <th className={styles.th}>Coin</th>
              <th className={`${styles.th} ${styles.num}`}>Price</th>
              <th className={`${styles.th} ${styles.num}`}>24h %</th>
              <th className={`${styles.th} ${styles.actionCol}`}>Action</th>
            </tr>
          </thead>

          <tbody>
            {items.slice(0, 15).map((c) => {
              const active = c.id === selectedId;
              const watched = watchSet.has(c.id);
              const pinned = primarySet.has(c.id);

              return (
                <tr key={c.id} className={`${styles.row} ${active ? styles.active : ""}`}>
                  {/* ⭐ */}
                  <td className={`${styles.td} ${styles.starCol}`}>
                    <button
                      className={styles.starBtn}
                      onClick={() => onToggleWatch(c.id)}
                      title={watched ? "Remove from watchlist" : "Add to watchlist"}
                      aria-label={watched ? "Unstar" : "Star"}
                    >
                      {watched ? "★" : "☆"}
                    </button>
                  </td>

                  {/* 📌 (watchlist view only) */}
                  {showPrimaryControls && (
                    <td className={`${styles.td} ${styles.pinCol}`}>
                      <button
                        className={`${styles.pinBtn} ${pinned ? styles.pinned : ""}`}
                        onClick={() => onTogglePrimary?.(c.id)}
                        title={pinned ? "Unset primary" : "Set as primary"}
                        aria-label={pinned ? "Unpin" : "Pin"}
                      >
                        {pinned ? "📌" : "📍"}
                      </button>
                    </td>
                  )}

                  <td className={styles.td}>
                    <div className={styles.coin}>
                      <img src={c.image} alt="" className={styles.icon} />
                      <span className={styles.name}>{c.name}</span>
                      <span className={styles.sym}>({c.symbol.toUpperCase()})</span>
                      {showPrimaryControls && pinned && (
                        <span className={styles.badge}>Primary</span>
                      )}
                    </div>
                  </td>

                  <td className={`${styles.td} ${styles.num}`}>{fmtPrice(c.current_price)}</td>

                  <td
                    className={`${styles.td} ${styles.num} ${
                      (c.price_change_percentage_24h || 0) >= 0 ? styles.up : styles.down
                    }`}
                  >
                    {fmtPct(c.price_change_percentage_24h)}
                  </td>

                  <td className={`${styles.td} ${styles.actionCol}`}>
                    <button
                      className={active ? styles.pillGhost : styles.pill}
                      onClick={() => onSelect(c.id)}
                    >
                      {active ? "Selected" : "View chart"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
