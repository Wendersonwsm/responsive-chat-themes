export const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
export const MONTHS_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

export function mkKey(year: number, monthIndex: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
}

export function parseKey(k: string) {
  const [y, m] = k.split('-').map(Number);
  return { year: y, month: m - 1 };
}

export function todayKey() {
  const n = new Date();
  return mkKey(n.getFullYear(), n.getMonth());
}

export function fmtMoney(n: number) {
  return 'R$ ' + (n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function fmtMoneyFull(n: number) {
  return 'R$ ' + (n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function monthLabel(key: string) {
  const { year, month } = parseKey(key);
  return `${MONTHS_PT[month]} ${year}`;
}

export function shortMonthLabel(key: string) {
  const { year, month } = parseKey(key);
  return `${MONTHS_SHORT[month]} ${String(year).slice(2)}`;
}

export function shiftMonth(key: string, delta: number) {
  const { year, month } = parseKey(key);
  const d = new Date(year, month + delta, 1);
  return mkKey(d.getFullYear(), d.getMonth());
}
