import type {
  DividendItem,
  HistoricalPoint,
  QuoteResult,
  ComputedReturn,
} from "../types";

function findStartEndPrices(history: HistoricalPoint[]) {
  if (!history || history.length < 2) return { start: undefined, end: undefined };
  const sorted = [...history].sort((a, b) => a.date - b.date);
  const start = sorted[0]?.adjustedClose ?? sorted[0]?.close;
  const end = sorted[sorted.length - 1]?.adjustedClose ?? sorted[sorted.length - 1]?.close;
  return { start, end };
}

function sumDividendsLast3Months(divs?: DividendItem[]) {
  if (!divs || !divs.length) return 0;
  const now = new Date();
  const threeMonthsAgo = new Date(now);
  threeMonthsAgo.setMonth(now.getMonth() - 3);

  return divs.reduce((acc, d) => {
    const iso = d.paymentDate || d.date;
    const amt = (typeof d.amount === "number" ? d.amount : d.dividends) ?? 0;
    if (!iso || !amt) return acc;
    const when = new Date(iso);
    if (when > threeMonthsAgo && when <= now) {
      return acc + amt;
    }
    return acc;
  }, 0);
}

function findLastDividend(divs?: DividendItem[]) {
  if (!divs || !divs.length) return null;
  const withAmt = divs
    .map((d) => ({
      date: d.paymentDate || d.date,
      amount: (typeof d.amount === "number" ? d.amount : d.dividends) ?? 0,
    }))
    .filter((x) => x.date && x.amount)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return withAmt[0] ?? null;
}

export function computeReturn3M(item: QuoteResult): ComputedReturn | null {
  const { start, end } = findStartEndPrices(item.historicalDataPrice || []);
  if (!start || !end) return null;

  const divSum = sumDividendsLast3Months(item.dividendsData);
  const totalReturn = ((end - start) + divSum) / start;

  return {
    ticker: item.symbol,
    name: item.shortName || item.longName,
    sector: item.sector,
    priceStart: start,
    priceEnd: end,
    dividendsSum: divSum,
    totalReturnPct: totalReturn * 100,
    lastDividend: findLastDividend(item.dividendsData),
  };
}
