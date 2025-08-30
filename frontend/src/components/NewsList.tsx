import type { NewsItem } from "../lib/api";
import "./NewsList.css";
/* 
function timeAgo(unixSec: number) {
  const diffMs = Date.now() - unixSec * 1000;
  const m = Math.floor(diffMs / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
*/
type Props = {
  items: NewsItem[];
  layout?: "grid" | "featured" | "pattern";
  featureEvery?: number; // only for "pattern"
};

function host(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; }
}

export default function NewsList({ items, layout = "grid", featureEvery = 6 }: Props) {
  if (!items.length) return <p style={{ opacity: .7 }}>No news.</p>;

   return (
    <div className={`news-grid ${layout !== "grid" ? "featured" : ""}`}>
      {items.map((n, i) => {
        const isFeatured =
          layout === "featured" ? i === 0 :
          layout === "pattern"  ? i % featureEvery === 0 : false;

        return (
          <article key={n.link} className={`news-card ${isFeatured ? "is-featured" : ""}`}>
            <a className="news-title" href={n.link} target="_blank" rel="noopener noreferrer nofollow">
              {n.title}
            </a>
            {n.summary && <p className="news-summary">{n.summary}</p>}
            <div className="news-meta">
              <span className="chip">{n.source}</span>
              <span className="dot" />
              <span className="muted">{new Date(n.published * 1000).toLocaleString()}</span>
            </div>
          </article>
        );
      })}
    </div>
  );
}
