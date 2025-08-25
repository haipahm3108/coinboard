import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

type Props = { prices?: [number, number][] };

function toSeries(prices: [number, number][]) {
  return (prices ?? [])
    .filter(p => Array.isArray(p) && p.length === 2 && Number.isFinite(p[0]) && Number.isFinite(p[1]))
    .map(([t, v]) => ({ t: Number(t), price: Number(v) }))
    .sort((a, b) => a.t - b.t);
}

export default function PriceChart({ prices = [] }: Props) {
  const data = toSeries(prices);

  if (!data.length) {
    return (
      <div style={{ height: 300, border: "1px dashed #bbb", display: "grid", placeItems: "center" }}>
        <span style={{ color: "#888" }}>No data points</span>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="t" tickFormatter={(t) => new Date(t).toLocaleDateString()} />
          {/* Let Recharts pick the Y range from data */}
          <YAxis domain={["dataMin", "dataMax"]} />
          <Tooltip labelFormatter={(v) => new Date(Number(v)).toLocaleString()} />
          <Line type="monotone" dataKey="price" dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}