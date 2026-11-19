/** Utilidades de fechas en formato YYYY-MM-DD, en la zona horaria local. */
export const TZ = process.env.ALIVE_TZ || "America/Lima";

export function toISODate(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

export function today(): string {
  return toISODate(new Date());
}

/** Fecha (mediodía UTC) a partir de YYYY-MM-DD, para aritmética sin problemas de horario. */
export function parseISO(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
}

export function addDays(s: string, n: number): string {
  const d = parseISO(s);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function isValidISODate(s: unknown): s is string {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(parseISO(s).getTime());
}

export function rangeDays(endInclusive: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => addDays(endInclusive, i - count + 1));
}

const DOW = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
const DOW_LONG = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
export const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
export const MONTHS_SHORT = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

export function dowShort(s: string) {
  return DOW[parseISO(s).getUTCDay()];
}
export function dowLong(s: string) {
  return DOW_LONG[parseISO(s).getUTCDay()];
}
export function dayNum(s: string) {
  return String(parseISO(s).getUTCDate());
}
/** "martes 17 de noviembre de 2026" */
export function longDate(s: string) {
  const d = parseISO(s);
  return `${dowLong(s)} ${d.getUTCDate()} de ${MONTHS[d.getUTCMonth()]} de ${d.getUTCFullYear()}`;
}
export function monthKey(s: string) {
  return s.slice(0, 7);
}
export function addMonths(month: string, n: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return d.toISOString().slice(0, 7);
}
export function monthLabel(month: string) {
  const [y, m] = month.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}
export function daysInMonth(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}
/** Semana ISO-like simple: índice 0..51 de la semana dentro del año. */
export function weekOfYear(s: string) {
  const d = parseISO(s);
  const start = Date.UTC(d.getUTCFullYear(), 0, 1, 12);
  return Math.min(51, Math.floor((d.getTime() - start) / (7 * 86400000)));
}
export function yearProgress(s: string) {
  const d = parseISO(s);
  const y = d.getUTCFullYear();
  const start = Date.UTC(y, 0, 1);
  const end = Date.UTC(y + 1, 0, 1);
  const pct = (d.getTime() - start) / (end - start);
  const left = Math.round((end - d.getTime()) / 86400000);
  return { pct: Math.round(pct * 100), daysLeft: left };
}

/** "YYYY-MM-DD HH:MM:SS" en hora local (para created_at / updated_at). */
export function localNow(): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
  const g = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return `${g("year")}-${g("month")}-${g("day")} ${g("hour")}:${g("minute")}:${g("second")}`;
}
