import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

type Props = { data: { date: string; close: number }[] };

const toShortBR = (d: string) => {
  if (!d) return d;
  if (d.includes("/")) {
    const [dd, mm] = d.split("/");
    return `${dd}/${mm}`;
  }
  const [y, m, dd] = d.split("-");
  return y && m && dd ? `${dd}/${m}` : d;
};

export default function PriceBarChart({ data }: Props) {
  return (
    <div style={{ width: "100%", height: 420, padding: "6px 8px" }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 12, left: 0 }}>
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
          <Bar dataKey="close" name="Fechamento" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
