import { useEffect, useMemo, useRef, useState } from "react";
import { listAssets } from "../services/brapi";

type Option = {
  stock: string;
  name: string;
  close?: number;
  change?: number;
  volume?: number;
  sector?: string;      // mantém string | undefined
  type?: string;
  logo?: string;
};

type Props = {
  value: string;
  onChange: (ticker: string) => void;
  type?: "stock" | "fund" | "bdr";
  placeholder?: string;
};

export default function TickerPicker({
  value,
  onChange,
  type,
  placeholder = "Buscar ticker (ex.: PETR4, MXRF11)...",
}: Props) {
  const [q, setQ] = useState(value);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [opts, setOpts] = useState<Option[]>([]);
  const boxRef = useRef<HTMLDivElement>(null);
  const timer = useRef<number | null>(null);

  // helper: converte item da BRAPI → Option, garantindo sector como string | undefined
  const toOption = (o: any): Option => ({
    stock: o.stock,
    name: o.name,
    close: o.close,
    change: o.change,
    volume: o.volume,
    sector: o.sector ?? undefined,   // <— aqui o fix (null → undefined)
    type: o.type,
    logo: o.logo,
  });

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  // Debounce da busca
  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      if (!q || q.trim().length < 2) {
        setOpts([]);
        return;
      }
      setLoading(true);
      try {
        const res = await listAssets({ search: q.trim(), type, limit: 15, sortBy: "volume", sortOrder: "desc" });
        const items: Option[] = (res.stocks ?? []).map(toOption);  // <— mapeia
        setOpts(items);
        setOpen(true);
      } catch {
        setOpts([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [q, type]);

  // “Sugestões iniciais” (Top por volume) quando q vazio
  const showSuggestions = useMemo(() => !q || q.trim().length < 2, [q]);

  useEffect(() => {
    if (!showSuggestions) return;
    (async () => {
      try {
        const res = await listAssets({ type, limit: 10, sortBy: "volume", sortOrder: "desc" });
        const items: Option[] = (res.stocks ?? []).map(toOption);  // <— mapeia
        setOpts(items);
      } catch {
        setOpts([]);
      }
    })();
  }, [showSuggestions, type]);

  function select(opt: Option) {
    onChange(opt.stock);
    setQ(opt.stock);
    setOpen(false);
  }

  return (
    <div ref={boxRef} style={{ position: "relative", minWidth: 260 }}>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value.toUpperCase())}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        style={{
          background: "transparent",
          border: "1px solid var(--border)",
          color: "var(--text)",
          padding: "10px 12px",
          borderRadius: 10,
          width: "100%",
        }}
      />
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            background: "var(--panel)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            boxShadow: "var(--shadow)",
            maxHeight: 360,
            overflowY: "auto",
            zIndex: 20,
          }}
        >
          {loading ? (
            <div style={{ padding: 10, color: "var(--muted)" }}>Buscando…</div>
          ) : opts.length === 0 ? (
            <div style={{ padding: 10, color: "var(--muted)" }}>Sem resultados.</div>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 6 }}>
              {opts.map((o) => (
                <li
                  key={o.stock}
                  onClick={() => select(o)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr auto",
                    gap: 10,
                    padding: "8px 10px",
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <span style={{ width: 24, height: 24, borderRadius: 6, overflow: "hidden", alignSelf: "center" }}>
                    {o.logo ? (
                      <img src={o.logo} alt="" width={24} height={24} style={{ display: "block" }} />
                    ) : (
                      <span style={{ display: "inline-block", width: 24, height: 24, opacity: 0.25, border: "1px solid var(--border)", borderRadius: 6 }} />
                    )}
                  </span>
                  {/* ▼ Força textos do item (nome/sector/tipo) a branco */}
                  <div style={{ overflow: "hidden", color: "#fff" }}>
                    <div style={{ fontWeight: 600, lineHeight: 1 }}>
                      {o.stock} <span style={{ opacity: 0.9, fontWeight: 500 }}>• {o.name}</span>
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#fff", // ← branco (antes var(--muted))
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                      }}
                    >
                      {o.sector ?? o.type ?? ""}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", alignSelf: "center", color: "#fff" }}>
                    {o.close != null && <div>R$ {o.close.toFixed(2)}</div>}
                    {o.change != null && (
                      <div style={{ fontSize: 12, color: o.change >= 0 ? "#79ffa1" : "#ff7b7b" }}>
                        {(o.change >= 0 ? "+" : "") + o.change.toFixed(2)}%
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
