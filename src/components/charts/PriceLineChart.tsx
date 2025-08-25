import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";

type Props = { data: { date: string; close: number }[] };

// "YYYY-MM-DD" ou "DD/MM/YYYY" -> "DD/MM"
const toShortBR = (d: string) => {
  if (!d) return d;
  if (d.includes("/")) {
    const [dd, mm] = d.split("/");
    return `${dd}/${mm}`;
  }
  const [y, m, dd] = d.split("-");
  return y && m && dd ? `${dd}/${m}` : d;
};

export default function PriceLineChart({ data }: Props) {
  return (
    <div style={{ width: "100%", height: 420, padding: "6px 8px" }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 12, left: 0 }}>
          <XAxis
            dataKey="date"
            tickFormatter={toShortBR}
            tickMargin={8}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis domain={["auto", "auto"]} />
          <Tooltip
            formatter={(v: any) => [`R$ ${Number(v).toFixed(2)}`, "Fechamento"]}
            labelFormatter={(l: any) => `Data: ${l}`}
          />
          <Line
            type="monotone"
            dataKey="close"
            name="Fechamento"
            dot={false}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
