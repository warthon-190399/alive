import "server-only";
import { and, asc, eq, gte } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { addDays, rangeDays } from "./dates";

export type HabitView = {
  id: number;
  name: string;
  pillar: string;
  timeHint: string;
  days: boolean[]; // últimos N días, el último es hoy
  doneToday: boolean;
  streak: number;
  pct: number;
};

export async function getHabitsOverview(todayISO: string, window = 30) {
  const db = await getDb();
  const habits = await db.select().from(schema.habits).where(eq(schema.habits.archived, false)).orderBy(asc(schema.habits.sort));
  const yearStart = `${todayISO.slice(0, 4)}-01-01`;
  const since = addDays(todayISO, -window) < yearStart ? addDays(todayISO, -window) : yearStart;
  const logs = await db.select().from(schema.habitLogs).where(gte(schema.habitLogs.date, since));
  const byHabit = new Map<number, Set<string>>();
  for (const l of logs) {
    if (!byHabit.has(l.habitId)) byHabit.set(l.habitId, new Set());
    byHabit.get(l.habitId)!.add(l.date);
  }
  const days = rangeDays(todayISO, window);
  let bestStreak = 0;
  let eligibleTotal = 0;

  const views: HabitView[] = habits.map((h) => {
    const set = byHabit.get(h.id) ?? new Set<string>();
    const flags = days.map((d) => set.has(d));
    let streak = 0;
    let d = set.has(todayISO) ? todayISO : addDays(todayISO, -1);
    while (set.has(d)) {
      streak++;
      d = addDays(d, -1);
    }
    // mejor racha del año
    let run = 0;
    for (const day of rangeDays(todayISO, 366)) {
      if (day < yearStart) continue;
      run = set.has(day) ? run + 1 : 0;
      bestStreak = Math.max(bestStreak, run);
    }
    // solo cuentan los días desde que el hábito existe
    const created = h.createdAt.slice(0, 10);
    const eligible = Math.max(1, days.filter((d) => d >= created).length);
    eligibleTotal += eligible;
    return { id: h.id, name: h.name, pillar: h.pillar, timeHint: h.timeHint, days: flags, doneToday: set.has(todayISO), streak, pct: Math.round((flags.filter(Boolean).length / eligible) * 100) };
  });

  // mapa del año: proporción de hábitos cumplidos por día
  const yearDays: { date: string; level: number }[] = [];
  const active = Math.max(1, habits.length);
  const countByDay = new Map<string, number>();
  for (const l of logs) if (l.date >= yearStart) countByDay.set(l.date, (countByDay.get(l.date) ?? 0) + 1);
  let cursor = yearStart;
  const yearEnd = `${todayISO.slice(0, 4)}-12-31`;
  while (cursor <= yearEnd) {
    const r = (countByDay.get(cursor) ?? 0) / active;
    yearDays.push({ date: cursor, level: cursor > todayISO ? -1 : r === 0 ? 0 : r < 0.25 ? 1 : r < 0.5 ? 2 : r < 0.85 ? 3 : 4 });
    cursor = addDays(cursor, 1);
  }

  const totalCells = eligibleTotal;
  const consistency = totalCells ? Math.round((views.reduce((a, v) => a + v.days.filter(Boolean).length, 0) / totalCells) * 100) : 0;
  return { habits: views, days, yearDays, consistency, bestStreak, checkins: logs.filter((l) => l.date >= yearStart).length };
}

export async function getTodayHabitCount(todayISO: string) {
  const db = await getDb();
  const logs = await db.select().from(schema.habitLogs).where(and(eq(schema.habitLogs.date, todayISO)));
  return logs.length;
}
