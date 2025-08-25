import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, Tooltip, ZAxis } from "recharts";

type Props = { data: { date: string; close: number }[] };

// indexa para usar X numérico e manter a ordem
const toIndexed = (data: Props["data"]) =>
  data.map((row, i) => ({ i, label: row.date, close: row.close }));

const toShortBR = (d: string) => {
  if (!d) return d;
  if (d.includes("/")) {
    const [dd, mm] = d.split("/");
    return `${dd}/${mm}`;
  }
  const [y, m, dd] = d.split("-");
  return y && m && dd ? `${dd}/${m}` : d;
};

export default function PriceScatterChart({ data }: Props) {
  const indexed = toIndexed(data);

  return (
    <div style={{ width: "100%", height: 420, padding: "6px 8px" }}>
      <ResponsiveContainer>
        <ScatterChart margin={{ top: 8, right: 8, bottom: 12, left: 0 }}>
          <XAxis
            type="number"
            dataKey="i"
            domain={[0, Math.max(0, indexed.length - 1)]}
            allowDecimals={false}
            tickFormatter={(i) => {
              const item = indexed[i as number];
              return item ? toShortBR(item.label) : "";
            }}
            tickMargin={8}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis dataKey="close" name="Fechamento" domain={["auto", "auto"]} />
          <ZAxis type="number" dataKey={() => 80} range={[60, 60]} />
          <Tooltip
            formatter={(val: any) => [`R$ ${Number(val).toFixed(2)}`, "Fechamento"]}
            labelFormatter={(idx) => {
              const item = indexed[idx as number];
              return item ? `Data: ${item.label}` : "";
            }}
          />
          <Scatter data={indexed} name="Fechamento" fill="currentColor" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
