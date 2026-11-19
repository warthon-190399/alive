import { createHabit } from "@/actions/habits";
import { ArchiveButton } from "@/components/habits/HabitRowActions";
import { TodayChecklist } from "@/components/habits/TodayChecklist";
import { PageHeader, SectionTitle } from "@/components/ui";
import { addDays, dayNum, dowLong, MONTHS_SHORT, today } from "@/lib/dates";
import { getHabitsOverview } from "@/lib/habits";
import { getPillarNames } from "@/lib/strategy";

export const dynamic = "force-dynamic";

const LEVELS = ["rgba(255,255,255,0.05)", "#4A2A1C", "#8A3E1E", "#D45A22", "#FF572E"];
const DEFAULT_PILLARS = ["Salud", "Carrera", "Relaciones", "Creatividad", "Finanzas", "Mente"];

export default async function HabitsPage() {
  const now = today();
  const [data, pillarNames] = await Promise.all([getHabitsOverview(now, 30), getPillarNames()]);
  const PILLARS = pillarNames.length ? pillarNames : DEFAULT_PILLARS;
  // columnas del mapa anual empiezan en la semana del 1 de enero
  const firstDow = new Date(`${now.slice(0, 4)}-01-01T12:00:00Z`).getUTCDay();
  const done = data.habits.filter((h) => h.doneToday).length;

  return (
    <>
      <PageHeader eyebrow="05 — Habits & Lifestyle" title="Lo que hago," accent="una y otra vez.">
        <div className="flex flex-wrap gap-8">
          <Kpi v={`${data.consistency}%`} l="consistencia · 30 días" />
          <Kpi v={String(data.bestStreak)} l="mejor racha del año" accent />
          <Kpi v={String(data.habits.length)} l="hábitos activos" />
        </div>
      </PageHeader>

      <section aria-label="Hoy y año" className="mt-7 flex flex-wrap gap-5">
        <div className="glass flex min-w-0 flex-[4_1_320px] flex-col gap-1.5 rounded-[20px] p-6">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="eyebrow text-faint">Hoy · {dowLong(now)} {dayNum(now)}</span>
            <span className="text-[13px] text-muted">{done} / {data.habits.length}</span>
          </div>
          <TodayChecklist items={data.habits} date={now} />
          <form action={createHabit} className="mt-4 flex flex-col gap-2 border-t border-white/[0.07] pt-4">
            <span className="eyebrow text-faint">Nuevo hábito</span>
            <label>
              <span className="sr-only">Nombre del hábito</span>
              <input name="name" required placeholder="Leer 20 páginas" className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm outline-none placeholder:text-faint" />
            </label>
            <div className="flex gap-2">
              <label className="flex-1">
                <span className="sr-only">Pilar</span>
                <select name="pillar" className="h-11 w-full rounded-xl border border-white/10 bg-[#1c1b1a] px-3 text-sm text-ink outline-none">
                  {PILLARS.map((p) => <option key={p}>{p}</option>)}
                </select>
              </label>
              <label className="w-28">
                <span className="sr-only">Hora sugerida</span>
                <input name="timeHint" placeholder="22:00" className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm outline-none placeholder:text-faint" />
              </label>
              <button type="submit" className="h-11 rounded-xl bg-vermilion px-4 text-sm font-bold text-obsidian">Añadir</button>
            </div>
          </form>
        </div>

        <div className="glass flex min-w-0 flex-[8_1_560px] flex-col gap-4 rounded-[20px] p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="eyebrow text-faint">{now.slice(0, 4)} · todos los hábitos</span>
            <span className="text-[13px] text-muted">{data.checkins} check-ins este año</span>
          </div>
          <div className="overflow-x-auto">
            <div className="grid min-w-[740px] auto-cols-[11px] grid-flow-col grid-rows-[repeat(7,11px)] gap-[3px]">
              {Array.from({ length: firstDow }, (_, i) => <span key={`pad${i}`} />)}
              {data.yearDays.map((d) => (
                <span key={d.date} title={d.date} className="block rounded-[2px]" style={{ background: d.level < 0 ? "transparent" : LEVELS[d.level] }} />
              ))}
            </div>
            <div className="mt-2 grid min-w-[740px] grid-cols-12">
              {MONTHS_SHORT.map((m) => <span key={m} className="font-mono text-[10px] text-faint">{m}</span>)}
            </div>
          </div>
          <div className="flex items-center gap-2 border-t border-white/[0.07] pt-3 text-xs text-muted">
            Menos {LEVELS.map((c) => <span key={c} aria-hidden="true" className="h-[11px] w-[11px] rounded-[2px]" style={{ background: c }} />)} Más
          </div>
        </div>
      </section>

      <section aria-label="Últimos 30 días" className="glass mt-5 rounded-[20px] px-7 py-6">
        <SectionTitle right={<span className="text-[13px] text-muted">{addDays(now, -29).slice(5).replace("-", "/")} — {now.slice(5).replace("-", "/")}</span>}>Últimos 30 días</SectionTitle>
        {data.habits.length === 0 ? (
          <p className="m-0 text-muted">Crea tu primer hábito para empezar a ver tu consistencia.</p>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[820px]">
              {data.habits.map((h) => (
                <div key={h.id} className="group grid h-[52px] grid-cols-[220px_minmax(0,1fr)_90px_60px_36px] items-center gap-4 border-t border-white/[0.07]">
                  <span className="flex flex-col"><span className="text-sm">{h.name}</span><span className="text-[11px] uppercase text-faint">{h.pillar}</span></span>
                  <span className="grid grid-cols-[repeat(30,minmax(0,1fr))] gap-[3px]">
                    {h.days.map((on, i) => (
                      <span key={i} className="block h-[18px] rounded-[3px]" style={{ background: on ? (i >= 30 - h.streak ? "#FF572E" : "#B44A1F") : "rgba(255,255,255,0.07)" }} />
                    ))}
                  </span>
                  <span className="font-mono text-xs text-[#C9C5BC]">racha {h.streak} d</span>
                  <span className="text-right font-display text-[22px]">{h.pct}%</span>
                  <ArchiveButton id={h.id} name={h.name} />
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </>
  );
}

function Kpi({ v, l, accent }: { v: string; l: string; accent?: boolean }) {
  return (
    <span className="flex flex-col">
      <span className={`font-display text-[44px] leading-none ${accent ? "text-vermilion" : ""}`}>{v}</span>
      <span className="text-xs text-muted">{l}</span>
    </span>
  );
}
