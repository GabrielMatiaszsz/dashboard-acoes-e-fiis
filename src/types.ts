// Tipo de cada item listado em /quote/list
export type BrapiListItem = {
  stock: string;      // ticker, ex: "HGLG11"
  name: string;       // nome completo
  sector?: string;    // setor
  type?: "fund" | "stock" | "bdr" | "etf" | string;
};

// Resposta de /quote/list
export type BrapiListResponse = {
  stocks: BrapiListItem[];
  availableSectors?: string[];
};

// Ponto histórico (usado em historicalDataPrice)
export type HistoricalPoint = {
  date: number; // epoch seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjustedClose?: number;
};

// Formatos possíveis de dividendos
export type DividendItem = {
  date: string;
  paymentDate?: string;
  amount?: number;
  dividends?: number;
};

// Novo formato (quando usamos modules)
export type CashDividend = {
  assetIssued?: string;
  paymentDate?: string;
  rate?: number;
  relatedTo?: string;
  approvedOn?: string;
  isinCode?: string;
  label?: string;
  lastDatePrior?: string;
  remarks?: string;
};
export type DividendsData = {
  cashDividends?: CashDividend[];
  stockDividends?: any[];
  subscriptions?: any[];
};

// Resultado do /quote
export type QuoteResult = {
  symbol: string;
  shortName?: string;
  longName?: string;
  sector?: string;
  regularMarketPrice?: number;
  logourl?: string;
  usedRange?: string;
  usedInterval?: string;
  historicalDataPrice?: HistoricalPoint[];
  dividendsData?: DividendItem[];       // formato "antigo"
  dividendsDataV2?: DividendsData;      // formato "novo" via modules
};

export type QuoteResponse = {
  results: QuoteResult[];
};

// Resultado calculado (ranking)
export type ComputedReturn = {
  ticker: string;
  name?: string;
  sector?: string;
  priceStart?: number;
  priceEnd?: number;
  dividendsSum?: number;
  totalReturnPct: number; // em %
  lastDividend?: { date: string; amount: number } | null;
};
