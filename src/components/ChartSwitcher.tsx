import { useMemo } from "react";
import PriceLineChart from "./charts/PriceLineChart";
import PriceBarChart from "./charts/PriceBarChart";
import PriceScatterChart from "./charts/PriceScatterChart";

export type ChartType = "line" | "bar" | "scatter";
export type Row = { date: string; close: number };

/** Converte "YYYY-MM-DD" -> "DD/MM/YYYY" sem depender de timezone */
function toBRDate(iso?: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso; // se vier em outro formato, mantém
  return `${d}/${m}/${y}`;
}

export function ChartSwitcher({ type, data }: { type: ChartType; data: Row[] }) {
  // Formata o campo `date` para pt-BR antes de enviar para os gráficos
  const dataBR = useMemo(
    () => data.map((r) => ({ ...r, date: toBRDate(r.date) })),
    [data]
  );

  if (type === "bar") return <PriceBarChart data={dataBR} />;
  if (type === "scatter") return <PriceScatterChart data={dataBR} />;
  return <PriceLineChart data={dataBR} />; // default: line
}
