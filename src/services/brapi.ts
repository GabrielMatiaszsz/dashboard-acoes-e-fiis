// BRAPI Service — cotações, histórico, dividendos e módulos financeiros
// Docs resumidas: /api/quote/{tickers}?range&interval&fundamental&dividends&modules=...

const BASE = "https://brapi.dev/api";
const TOKEN = import.meta.env.VITE_BRAPI_TOKEN as string | undefined;

// ---------- Tipos base ----------
export type Candle = {
  date: number;         // epoch (segundos)
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  adjustedClose?: number;
  volume?: number;
};

export type DividendCash = {
  assetIssued?: string;
  paymentDate?: string;     // ISO
  rate?: number;
  relatedTo?: string;
  approvedOn?: string;
  isinCode?: string;
  label?: string;           // "DIVIDENDO" | "JCP" etc.
  lastDatePrior?: string;
  remarks?: string;
};

export type DividendsData = {
  cashDividends?: DividendCash[];
  stockDividends?: any[];
  subscriptions?: any[];
};

export type QuoteResult = {
  symbol: string;
  currency?: string;
  shortName?: string;
  longName?: string;
  regularMarketPrice?: number;
  regularMarketChangePercent?: number;
  regularMarketTime?: string;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  regularMarketVolume?: number;
  regularMarketPreviousClose?: number;
  historicalDataPrice?: Candle[];
  dividendsData?: DividendsData;

  // Módulos financeiros (alguns exemplos)
  summaryProfile?: {
    address1?: string; city?: string; state?: string; zip?: string;
    website?: string; industry?: string; sector?: string; longBusinessSummary?: string;
    fullTimeEmployees?: number;
  };
  balanceSheetHistory?: any[];
  balanceSheetHistoryQuarterly?: any[];
  incomeStatementHistory?: any[];
  incomeStatementHistoryQuarterly?: any[];
  cashflowHistory?: any[];
  cashflowHistoryQuarterly?: any[];
  defaultKeyStatistics?: any;
  defaultKeyStatisticsHistory?: any[];
  defaultKeyStatisticsHistoryQuarterly?: any[];
  financialData?: any;
  financialDataHistory?: any[];
  financialDataHistoryQuarterly?: any[];
  valueAddedHistory?: any[];
  valueAddedHistoryQuarterly?: any[];
};

export type QuoteResponse = {
  results?: QuoteResult[];
  requestedAt?: string;
  took?: string;
};

export type Range =
  | "1d" | "5d" | "7d" | "1mo" | "3mo" | "6mo"
  | "1y" | "2y" | "5y" | "10y" | "ytd" | "max";

export type Interval =
  | "1m" | "2m" | "5m" | "15m" | "30m" | "60m" | "90m" | "1h"
  | "1d" | "5d" | "1wk" | "1mo" | "3mo";

export type ModuleName =
  | "summaryProfile"
  | "balanceSheetHistory" | "balanceSheetHistoryQuarterly"
  | "incomeStatementHistory" | "incomeStatementHistoryQuarterly"
  | "cashflowHistory" | "cashflowHistoryQuarterly"
  | "defaultKeyStatistics" | "defaultKeyStatisticsHistory" | "defaultKeyStatisticsHistoryQuarterly"
  | "financialData" | "financialDataHistory" | "financialDataHistoryQuarterly"
  | "valueAddedHistory" | "valueAddedHistoryQuarterly";

// ---------- Utils ----------
function authHeaders(): Headers {
  const h = new Headers();
  if (TOKEN) h.set("Authorization", `Bearer ${TOKEN}`);
  return h;
}

function toHttpError(res: Response) {
  const map: Record<number, string> = {
    400: "Parâmetros inválidos (400).",
    401: "Token ausente ou inválido (401).",
    402: "Limite do plano excedido (402).",
    404: "Ticker não encontrado (404).",
  };
  return new Error(map[res.status] ?? `Erro HTTP ${res.status}`);
}

// ---------- Chamada principal /quote ----------
export type QuoteOptions = {
  range?: Range;          // retorna historicalDataPrice
  interval?: Interval;    // granularidade do histórico
  fundamental?: boolean;  // inclui P/L, LPA básicos
  dividends?: boolean;    // inclui dividendsData
  modules?: ModuleName[]; // adiciona módulos financeiros detalhados
};

export async function getQuoteRaw(
  tickers: string | string[],
  opts: QuoteOptions = {}
): Promise<QuoteResponse> {
  const list = Array.isArray(tickers) ? tickers.join(",") : tickers;
  const url = new URL(`${BASE}/quote/${encodeURIComponent(list)}`);

  if (opts.range) url.searchParams.set("range", opts.range);
  if (opts.interval) url.searchParams.set("interval", opts.interval);
  if (opts.fundamental) url.searchParams.set("fundamental", "true");
  if (opts.dividends) url.searchParams.set("dividends", "true");
  if (opts.modules?.length) url.searchParams.set("modules", opts.modules.join(","));

  const res = await fetch(url.toString(), { headers: authHeaders() });
  if (!res.ok) throw toHttpError(res);
  return res.json() as Promise<QuoteResponse>;
}

// ---------- Conveniências de alto nível ----------
/** Cotação + histórico (para os gráficos) de um único ticker */
export async function getQuoteHistory(
  ticker: string,
  opts: { range?: Range; interval?: Interval } = {}
) {
  const json = await getQuoteRaw(ticker, { range: opts.range, interval: opts.interval });
  const item = json.results?.[0];
  if (!item) throw new Error("Sem resultados para o ticker.");

  const candles = (item.historicalDataPrice ?? []).filter(c => c.close != null);
  // Normaliza para o formato dos componentes de gráfico
  const series = candles.map(c => ({
    date: new Date(c.date * 1000).toISOString().slice(0, 10),
    close: Number(c.close),
  }));

  return {
    meta: {
      symbol: item.symbol,
      name: item.longName ?? item.shortName ?? ticker,
      price: item.regularMarketPrice,
      changePct: item.regularMarketChangePercent,
      at: item.regularMarketTime,
    },
    series,     // [{ date: "YYYY-MM-DD", close: number }]
    raw: item,  // acesso completo, se necessário
  };
}

/** Dividendos (cashDividends) de um ticker */
export async function getDividends(ticker: string) {
  const json = await getQuoteRaw(ticker, { dividends: true });
  const item = json.results?.[0];
  const cash = item?.dividendsData?.cashDividends ?? [];
  return cash.map(d => ({
    label: d.label ?? "DIV",
    paymentDate: d.paymentDate ? new Date(d.paymentDate).toISOString().slice(0, 10) : "",
    rate: d.rate ?? 0,
    relatedTo: d.relatedTo ?? "",
  }));
}

/** Módulos financeiros (ex.: DRE, BP, DFC, estatísticas) */
export async function getFinancialModules(
  ticker: string,
  modules: ModuleName[]
) {
  const json = await getQuoteRaw(ticker, { modules });
  const item = json.results?.[0];
  if (!item) throw new Error("Sem resultados para módulos.");
  // Retorna apenas os módulos solicitados
  const picked: Record<string, unknown> = {};
  for (const m of modules) {
    picked[m] = (item as any)[m];
  }
  return picked;
}

/** Cotação rápida (preço/var%) de um ou mais tickers */
export async function getSnapshot(tickers: string | string[]) {
  const json = await getQuoteRaw(tickers);
  return (json.results ?? []).map(r => ({
    symbol: r.symbol,
    name: r.longName ?? r.shortName ?? r.symbol,
    price: r.regularMarketPrice ?? null,
    changePct: r.regularMarketChangePercent ?? null,
  }));
}

// ---------- Helpers úteis ao app ----------
/**
 * Regras de teste/produção:
 * - PETR4, MGLU3, VALE3, ITUB4 liberados sem token (incluindo histórico/dividendos/módulos).
 * - Qualquer mistura com outro ticker => toda a chamada precisa de token.
 * Dica: para produção, preferira proxy no seu backend para não expor o token.
 */
export const BRAPI_RULES = Object.freeze({
  testTickers: ["PETR4", "MGLU3", "VALE3", "ITUB4"],
  requiresTokenWhenMixed: true,
});

/** Sugestão de ranges “comuns” para UI */
export const COMMON_RANGES: Range[] = ["1mo", "3mo", "6mo", "1y", "ytd"];
export const COMMON_INTERVALS: Interval[] = ["1d", "1wk", "1mo"];

// --- Tipos para listagem --------
export type ListAssetsParams = {
  search?: string;
  type?: "stock" | "fund" | "bdr";
  sector?: string;
  sortBy?: "name" | "close" | "change" | "change_abs" | "volume" | "market_cap_basic" | "sector";
  sortOrder?: "asc" | "desc";
  limit?: number;
  page?: number;
};

export type ListAssetsItem = {
  stock: string;
  name: string;
  close?: number;
  change?: number;
  volume?: number;
  market_cap?: number | null;
  sector?: string | null;
  type?: "stock" | "fund" | "bdr";
  logo?: string;
};

export type ListAssetsResponse = {
  indexes?: Array<{ stock: string; name: string }>;
  stocks: ListAssetsItem[];
  availableSectors?: string[];
  availableStockTypes?: Array<"stock" | "fund" | "bdr">;
  currentPage?: number;
  totalPages?: number;
  itemsPerPage?: number;
  totalCount?: number;
  hasNextPage?: boolean;
  // compat:
  page?: number;
  total?: number;
};

// --- Função listAssets (usa /api/quote/list) --------
export async function listAssets(params: ListAssetsParams = {}): Promise<ListAssetsResponse> {
  const url = new URL("https://brapi.dev/api/quote/list");
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== "") url.searchParams.set(k, String(v));
  });

  const res = await fetch(url.toString(), { headers: authHeaders() });
  if (!res.ok) throw toHttpError(res);
  const json = await res.json();

  return {
    indexes: json?.indexes ?? [],
    stocks: Array.isArray(json?.stocks) ? json.stocks : [],
    availableSectors: json?.availableSectors ?? [],
    availableStockTypes: json?.availableStockTypes ?? [],
    currentPage: json?.currentPage ?? json?.page,
    totalPages: json?.totalPages,
    itemsPerPage: json?.itemsPerPage,
    totalCount: json?.totalCount ?? json?.total,
    hasNextPage: json?.hasNextPage,
    page: json?.page,
    total: json?.total,
  };
}
  


