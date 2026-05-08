export type YieldFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Investment {
  id: string;
  user_id: string;
  name: string;
  type: string;
  amount_invested: number;
  start_date: string; // YYYY-MM-DD
  yield_rate: number; // % per period
  yield_frequency: YieldFrequency;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const FREQ_DAYS: Record<YieldFrequency, number> = {
  daily: 1, weekly: 7, monthly: 30, yearly: 365,
};

export const FREQ_LABEL: Record<YieldFrequency, string> = {
  daily: 'Diário', weekly: 'Semanal', monthly: 'Mensal', yearly: 'Anual',
};

export const INVESTMENT_TYPES = [
  'CDB', 'Tesouro Direto', 'LCI/LCA', 'Ações', 'Fundos', 'Cripto', 'Poupança', 'Outros',
];

function diffDays(from: Date, to: Date) {
  return Math.max(0, Math.floor((to.getTime() - from.getTime()) / 86400000));
}

export function periodsElapsed(inv: Pick<Investment, 'start_date' | 'yield_frequency'>, today = new Date()): number {
  const start = new Date(inv.start_date + 'T00:00:00');
  const days = diffDays(start, today);
  return days / FREQ_DAYS[inv.yield_frequency];
}

export function currentValue(inv: Investment, today = new Date()): number {
  const periods = periodsElapsed(inv, today);
  const rate = Number(inv.yield_rate) / 100;
  return Number(inv.amount_invested) * Math.pow(1 + rate, periods);
}

export function profit(inv: Investment, today = new Date()): number {
  return currentValue(inv, today) - Number(inv.amount_invested);
}

export function profitability(inv: Investment, today = new Date()): number {
  if (!inv.amount_invested) return 0;
  return (profit(inv, today) / Number(inv.amount_invested)) * 100;
}

export interface SeriesPoint { date: string; value: number; profit: number; }

/** Generates a time series from start to today (one point per natural period). */
export function buildSeries(inv: Investment, today = new Date()): SeriesPoint[] {
  const start = new Date(inv.start_date + 'T00:00:00');
  const stepDays = FREQ_DAYS[inv.yield_frequency];
  const totalDays = diffDays(start, today);
  const points: SeriesPoint[] = [];
  const principal = Number(inv.amount_invested);
  const rate = Number(inv.yield_rate) / 100;

  // Limit to ~60 points for charting clarity
  const totalPeriods = totalDays / stepDays;
  const maxPoints = 60;
  const skip = Math.max(1, Math.ceil(totalPeriods / maxPoints));

  for (let p = 0; p <= totalPeriods; p += skip) {
    const d = new Date(start.getTime() + p * stepDays * 86400000);
    const value = principal * Math.pow(1 + rate, p);
    points.push({ date: d.toISOString().slice(0, 10), value, profit: value - principal });
  }
  // Always include current value as last point
  const last = points[points.length - 1];
  const cv = currentValue(inv, today);
  if (!last || last.value !== cv) {
    points.push({ date: today.toISOString().slice(0, 10), value: cv, profit: cv - principal });
  }
  return points;
}

export function projectedProfit(inv: Pick<Investment, 'amount_invested' | 'yield_rate' | 'yield_frequency'>, months: number): number {
  const periodsPerMonth = 30 / FREQ_DAYS[inv.yield_frequency];
  const periods = months * periodsPerMonth;
  const rate = Number(inv.yield_rate) / 100;
  return Number(inv.amount_invested) * (Math.pow(1 + rate, periods) - 1);
}
