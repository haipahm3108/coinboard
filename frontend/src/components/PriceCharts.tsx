import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useMemo } from "react";

type Props = { prices?: [number, number][], days?: number };

// Compact number formatter, e.g. 12345 -> "12.3K"
const fmtCompact = new Intl.NumberFormat(undefined, {
  notation: "compact",
  maximumFractionDigits: 2,
});

// Build a small set of X ticks to prevent crowding
function buildXTicks(data: {t:number}[]) {
  if (!data.length) return [];
  const target = 6;
  const step = Math.max(1, Math.floor(data.length / target));
  return data.filter((_, i) => i % step === 0).map(d => d.t);
}

function toSeries(prices: [number, number][]) {
  return (prices ?? [])
    .filter(p => Array.isArray(p) && p.length === 2 && Number.isFinite(p[0]) && Number.isFinite(p[1]))
    .map(([t, v]) => ({ t: Number(t), price: Number(v) }))
    .sort((a, b) => a.t - b.t);
}


//function formatTick(t: number, days = 7) {
  //const d = new Date(t);
  //return days <= 1
  //  ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  //  : d.toLocaleDateString([], { month: "short", day: "numeric" }); // e.g., "Aug 26"
//}


export default function PriceChart({ prices = [], days = 7 }: Props) {
  const data = toSeries(prices);
  
  // Heuristic: compute a Y-axis width that fits the biggest number
  const yAxisWidth = useMemo(() => {
    if (!data.length) return 48; // default
    const maxVal = Math.max(...data.map(d => d.price));
    // Estimate label length after compact formatting
    const sample = fmtCompact.format(maxVal);     // e.g., "123.4K"
    const chars = Math.max(sample.length, 4);     // safety floor
    return Math.min(90, Math.max(48, chars * 8)); // ~8px per char
  }, [data]);
  
  const xTicks = useMemo(() => buildXTicks(data), [data]);
  
//  const ticks = useMemo(() => {
//    if (data.length === 0) return [];
//    const target = 6;
//    const step = Math.max(1, Math.floor(data.length / target));
//    return data.filter((_, i) => i % step === 0).map(d => d.t);
//  }, [data]);

  if (!data.length) {
    return (
      <div style={{ height: 300, border: "1px dashed #bbb", display: "grid", placeItems: "center" }}>
        <span style={{ color: "#888" }}>No data points</span>
      </div>
    );
  }
  
  const formatDateTick = (t: number) =>
    days <= 1
      ? new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : new Date(t).toLocaleDateString([], { month: "short", day: "numeric" });

  return (
       <div style={{ width: "100%", height: 320 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="t"
            type="number"
            domain={["dataMin", "dataMax"]}
            ticks={xTicks}
            tickFormatter={(t) => formatDateTick(Number(t))}
            tick={{ fontSize: 11 }}
            minTickGap={16}
            tickMargin={8}
            interval="preserveStartEnd"
            angle={days > 7 ? -30 : 0}
            height={days > 7 ? 48 : 30}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={["dataMin", "dataMax"]}
            width={yAxisWidth}                 // <-- reserve enough space
            tickFormatter={(n) => fmtCompact.format(Number(n))} // <-- compact labels
            tick={{ fontSize: 11 }}
            tickMargin={6}
            axisLine={false}
            tickLine={false}
            allowDecimals={true}
          />
          <Tooltip
            labelFormatter={(v) => new Date(Number(v)).toLocaleString()}
            formatter={(val: number) => [val.toLocaleString(undefined, { maximumFractionDigits: 8 }), "Price"]}
          />
          <Line type="monotone" dataKey="price" dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
