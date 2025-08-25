import { useEffect, useMemo, useState } from "react";
import { ChartSwitcher } from "../components/ChartSwitcher";
import type { ChartType } from "../components/ChartSwitcher";
import "../styles/dashboard.css";
import "../styles/rico-theme.css"; // tema (sólido, sem blur)

import TickerPicker from "../components/TickerPicker";
import AssetsBrowserDrawer from "../components/AssetsBrowserDrawer";
import {
  getQuoteHistory,
  getDividends,
  type Range,
  COMMON_RANGES,
} from "../services/brapi";

type Row = { date: string; close: number };

/** Formata "YYYY-MM-DD" -> "DD/MM/YYYY" (sem risco de fuso) */
function toBRDate(iso?: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

export default function Dashboard() {
  const [chartType, setChartType] = useState<ChartType>("line");

  // ---- Filtros / controles ----
  const [ticker, setTicker] = useState("PETR4");
  const [range, setRange] = useState<Range>("3mo");
  const [interval, setInterval] = useState<"1d" | "1wk" | "1mo">("1d");
  const [browserOpen, setBrowserOpen] = useState(false);

  // ---- Dados carregados da API ----
  const [data, setData] = useState<Row[]>([]);
  const [dividends, setDividends] = useState<
    { label: string; paymentDate: string; rate: number; relatedTo: string }[]
  >([]);
  const [meta, setMeta] = useState<{ symbol?: string; name?: string; price?: number; changePct?: number } | null>(null);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Ajuste automático do interval conforme o range
  useEffect(() => {
    if (range === "1y" || range === "ytd") setInterval("1wk");
    else if (range === "5y" || range === "10y" || range === "max") setInterval("1mo");
    else setInterval("1d");
  }, [range]);

  // Carrega histórico + meta
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr(null);
    (async () => {
      try {
        const r = await getQuoteHistory(ticker.trim().toUpperCase(), { range, interval });
        if (!alive) return;
        setMeta(r.meta);
        setData(r.series);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message ?? "Erro ao carregar dados.");
        setData([]);
        setMeta(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [ticker, range, interval]);

  // Carrega dividendos
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const d = await getDividends(ticker.trim().toUpperCase());
        if (alive) setDividends(d);
      } catch {
        if (alive) setDividends([]);
      }
    })();
    return () => { alive = false; };
  }, [ticker]);

  // Fallback (se API falhar)
  const fallback = useMemo<Row[]>(
    () => [
      { date: "2025-05-02", close: 9.51 },
      { date: "2025-05-09", close: 9.62 },
      { date: "2025-05-16", close: 9.38 },
      { date: "2025-05-23", close: 9.74 },
      { date: "2025-05-30", close: 9.69 },
      { date: "2025-06-06", close: 9.83 },
      { date: "2025-06-13", close: 9.77 },
      { date: "2025-06-20", close: 9.95 },
      { date: "2025-06-27", close: 10.02 },
      { date: "2025-07-04", close: 10.11 },
      { date: "2025-07-11", close: 10.05 },
      { date: "2025-07-18", close: 10.22 },
      { date: "2025-07-25", close: 10.34 },
      { date: "2025-08-01", close: 10.28 },
      { date: "2025-08-08", close: 10.49 },
      { date: "2025-08-15", close: 10.41 },
      { date: "2025-08-22", close: 10.58 },
    ],
    []
  );

  const series = data.length ? data : fallback;

  const priceLabel =
    meta?.price != null ? `R$ ${meta.price.toFixed(2)}` : "--";
  const changeLabel =
    meta?.changePct != null
      ? `${(meta.changePct >= 0 ? "+" : "")}${meta.changePct.toFixed(2)}%`
      : "--";

  return (
    <div
      className="dash rico-theme"
      style={{ backdropFilter: "none", WebkitBackdropFilter: "none", filter: "none" }}
    >
      <header className="dash__header" style={{ backdropFilter: "none", WebkitBackdropFilter: "none", filter: "none" }}>
        <div className="dash__title">
          <h1>Dashboard de Ativos</h1>
          <p>Visualize o movimento mensal dentro de três mêses das principais ações da bolsa Brasileira.</p>
        </div>

        {/* Filtros (uma única segmented contendo tudo) */}
        <div className="dash__actions" style={{ gap: 12 }}>
          <div className="segmented" style={{ padding: 8, gap: 8 }}>
            <TickerPicker value={ticker} onChange={setTicker} />

            <button
              className="segmented__btn"
              onClick={() => setBrowserOpen(true)}
              title="Ver lista completa de ativos"
            >
              Explorar ativos
            </button>

            <select
              value={range}
              onChange={(e) => setRange(e.target.value as Range)}
              aria-label="Período"
              className="rico-input"
            >
              {COMMON_RANGES.map((r) => (
                <option key={r} value={r}>
                  {r.toUpperCase()}
                </option>
              ))}
              <option value="max">MAX</option>
            </select>

            <button
              className={`segmented__btn ${chartType === "line" ? "is-active" : ""}`}
              onClick={() => setChartType("line")}
              aria-pressed={chartType === "line"}
              title="Linhas"
            >
              Linhas
            </button>
            <button
              className={`segmented__btn ${chartType === "bar" ? "is-active" : ""}`}
              onClick={() => setChartType("bar")}
              aria-pressed={chartType === "bar"}
              title="Barras"
            >
              Barras
            </button>
            <button
              className={`segmented__btn ${chartType === "scatter" ? "is-active" : ""}`}
              onClick={() => setChartType("scatter")}
              aria-pressed={chartType === "scatter"}
              title="Pontos"
            >
              Pontos
            </button>
          </div>
        </div>
      </header>

      <main
        className="dash__content"
        style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr 320px", backdropFilter: "none", WebkitBackdropFilter: "none", filter: "none" }}
      >
        {/* Painel do gráfico */}
        <section className="panel" style={{ minHeight: 480, backdropFilter: "none", WebkitBackdropFilter: "none", filter: "none" }}>
          <div className="panel__head">
            <h2 style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {meta?.name ? `${meta.name} (${meta.symbol})` : `Histórico — ${ticker.toUpperCase()}`}
            </h2>
            <div className="badge" title="Preço / Variação diária">
              {priceLabel} • {changeLabel}
            </div>
          </div>

          <div className="panel__body" style={{ backdropFilter: "none", WebkitBackdropFilter: "none", filter: "none" }}>
            {loading && <div style={{ padding: 12, opacity: 0.8 }}>Carregando…</div>}
            {err && <div style={{ padding: 12, color: "var(--down)" }}>{err}</div>}
            <ChartSwitcher type={chartType} data={series} />
          </div>
        </section>

        {/* Painel de dividendos */}
        <aside className="panel" style={{ backdropFilter: "none", WebkitBackdropFilter: "none", filter: "none" }}>
          <div className="panel__head">
            <h2>Dividendos</h2>
            <span className="badge">Recentes</span>
          </div>
          <div className="panel__body" style={{ color: "#fff" }}>
            {dividends.length === 0 ? (
              <div style={{ padding: "8px 10px", color: "var(--muted)" }}>
                Sem registros recentes para {ticker.toUpperCase()}.
              </div>
            ) : (
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {dividends.slice(0, 10).map((d, i) => (
                  <li
                    key={i}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "92px 1fr auto",
                      gap: 8,
                      padding: "8px 10px",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    {/* ▼ data em formato brasileiro */}
                    <span style={{ opacity: 0.9 }}>{toBRDate(d.paymentDate)}</span>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {d.relatedTo || d.label}
                    </span>
                    <strong>R$ {d.rate.toFixed(4)}</strong>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </main>

      {/* Drawer de explorar ativos */}
      <AssetsBrowserDrawer
        open={browserOpen}
        onClose={() => setBrowserOpen(false)}
        onPick={(t) => {
          setTicker(t);
          setBrowserOpen(false);
        }}
      />
    </div>
  );
}
