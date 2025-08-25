import { useEffect, useMemo, useState } from "react";
import { listAssets, type ListAssetsItem } from "../services/brapi";
import "../styles/rico-theme.css"; // 🔸 importa o tema (azul-escuro + laranja)

type Props = {
  open: boolean;
  onClose: () => void;
  onPick: (ticker: string) => void;
  defaultType?: "stock" | "fund" | "bdr";
};

export default function AssetsBrowserDrawer({ open, onClose, onPick, defaultType }: Props) {
  const [q, setQ] = useState("");
  const [type, setType] = useState<"stock" | "fund" | "bdr" | "">((defaultType ?? "") as any);
  const [sector, setSector] = useState("");
  const [sortBy, setSortBy] = useState<"volume" | "name" | "close" | "change" | "market_cap_basic" | "sector">("volume");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const [rows, setRows] = useState<ListAssetsItem[]>([]);
  const [sectors, setSectors] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<{ totalPages?: number; totalCount?: number }>({});

  // Reinicia paginação quando filtros mudam
  useEffect(() => { setPage(1); }, [q, type, sector, sortBy, sortOrder]);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setLoading(true);
    (async () => {
      try {
        const resp = await listAssets({
          search: q || undefined,
          type: (type || undefined) as any,
          sector: sector || undefined,
          sortBy,
          sortOrder,
          limit,
          page,
        });
        if (!alive) return;
        setRows(resp.stocks);
        setMeta({ totalPages: resp.totalPages, totalCount: resp.totalCount });
        if (resp.availableSectors?.length) setSectors(resp.availableSectors);
        if (resp.availableStockTypes?.length) setTypes(resp.availableStockTypes);
      } catch {
        if (!alive) return;
        setRows([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [open, q, type, sector, sortBy, sortOrder, page, limit]);

  const header = useMemo(() => (
    <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "center" }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value.toUpperCase())}
          placeholder="Buscar por ticker (ex.: PETR, ITUB, MXRF)…"
          className="rico-input"
        />
        <select value={type} onChange={(e) => setType(e.target.value as any)} className="rico-input">
          <option value="">Todos</option>
          <option value="stock">Ações</option>
          <option value="fund">FIIs</option>
          <option value="bdr">BDRs</option>
        </select>
        <select value={sector} onChange={(e) => setSector(e.target.value)} className="rico-input">
          <option value="">Setor (todos)</option>
          {sectors.map((s) => (<option key={s} value={s}>{s}</option>))}
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="rico-input">
          <option value="volume">Volume</option>
          <option value="name">Nome</option>
          <option value="close">Preço</option>
          <option value="change">Variação %</option>
          <option value="market_cap_basic">Market Cap</option>
          <option value="sector">Setor</option>
        </select>
        <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as any)} className="rico-input">
          <option value="desc">Desc</option>
          <option value="asc">Asc</option>
        </select>
      </div>
      <button onClick={onClose} className="segmented__btn">Fechar</button>
    </div>
  ), [q, type, sector, sortBy, sortOrder, sectors, onClose]);

  return (
    <div
      className="rico-theme" // 🔸 aplica a paleta do tema
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: open ? "auto" : "none",
        zIndex: 50,
      }}
    >
      {/* backdrop */}
      <div
        onClick={onClose}
        className="drawer-backdrop"
        style={{ position: "absolute", inset: 0, transition: ".2s" }}
      />
      {/* drawer */}
      <div
        className="drawer"
        style={{
          position: "absolute",
          top: 0, right: 0, bottom: 0,
          width: "min(860px, 100%)",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform .25s ease",
          display: "flex", flexDirection: "column", gap: 12,
          padding: 16,
        }}
      >
        <h2 style={{ margin: 0 }}>Explorar Ativos</h2>
        {header}

        <div className="result-box" style={{ flex: 1 }}>
          {loading ? (
            <div style={{ padding: 16, color: "var(--muted)" }}>Carregando…</div>
          ) : rows.length === 0 ? (
            <div style={{ padding: 16, color: "var(--muted)" }}>Nenhum resultado.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Ticker</th>
                  <th>Nome</th>
                  <th>Setor</th>
                  <th title="Último preço">Preço</th>
                  <th title="Variação %">Var%</th>
                  <th title="Volume">Vol</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.stock}>
                    <td><strong>{r.stock}</strong></td>
                    <td style={{ maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</td>
                    <td>{r.sector ?? "-"}</td>
                    <td>{r.close != null ? `R$ ${r.close.toFixed(2)}` : "-"}</td>
                    <td style={{ color: (r.change ?? 0) >= 0 ? "var(--up)" : "var(--down)" }}>
                      {r.change != null ? `${r.change.toFixed(2)}%` : "-"}
                    </td>
                    <td>{r.volume ?? "-"}</td>
                    <td>
                      <button className="table-action" onClick={() => onPick(r.stock)}>
                        Selecionar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Paginação */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <span style={{ color: "var(--muted)" }}>
            Página {page} {meta.totalPages ? `de ${meta.totalPages}` : ""} {meta.totalCount ? `• ${meta.totalCount} itens` : ""}
          </span>
          <div className="segmented">
            <button className="segmented__btn" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Anterior</button>
            <button className="segmented__btn" onClick={() => setPage(p => p + 1)}>Próxima</button>
          </div>
        </div>
      </div>
    </div>
  );
}
