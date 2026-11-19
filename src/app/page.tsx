import { eq } from "drizzle-orm";
import Link from "next/link";
import { TodayChecklist } from "@/components/habits/TodayChecklist";
import { Priorities } from "@/components/overview/Priorities";
import { getDb, schema } from "@/db";
import { longDate, monthKey, MONTHS_SHORT, today, yearProgress } from "@/lib/dates";
import { getHabitsOverview } from "@/lib/habits";
import { getPillars, getProjects } from "@/lib/strategy";
import { entryText, getEntry, getOneYearAgo, getRecentDays, mediaMap } from "@/lib/journal";

export const dynamic = "force-dynamic";

const LEVELS = ["rgba(255,255,255,0.05)", "#4A2A1C", "#8A3E1E", "#D45A22", "#FF572E"];

function greeting() {
  const h = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: process.env.ALIVE_TZ || "America/Lima" }).format(new Date()));
  return h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
}

export default async function Overview() {
  const now = today();
  const db = await getDb();
  const [prios, habits, recent, yearAgo, projects, pillars] = await Promise.all([
    db.select().from(schema.priorities).where(eq(schema.priorities.date, now)),
    getHabitsOverview(now, 35),
    getRecentDays(1),
    getOneYearAgo(now),
    getProjects(),
    getPillars(monthKey(now)),
  ]);
  const moving = projects.filter((p) => p.status === "activo").slice(0, 3);
  const last = recent[0] ? await getEntry(recent[0].date) : null;
  const lastImgId = last?.blocks.find((b) => b.type === "image");
  const lastImg = lastImgId && lastImgId.type === "image" ? (await mediaMap([lastImgId.mediaId]))[lastImgId.mediaId] : undefined;
  const yp = yearProgress(now);
  const month = Number(now.slice(5, 7)) - 1;

  // consistencia de las últimas 5 semanas (35 días)
  const heat = Array.from({ length: 35 }, (_, i) => {
    const total = habits.habits.length || 1;
    const n = habits.habits.filter((h) => h.days[i]).length;
    const r = n / total;
    return r === 0 ? 0 : r < 0.25 ? 1 : r < 0.5 ? 2 : r < 0.85 ? 3 : 4;
  });
  const topStreak = habits.habits.reduce((a, h) => (h.streak > a.streak ? h : a), { streak: 0, name: "" } as { streak: number; name: string });

  return (
    <>
      <header className="flex flex-col gap-2.5 pt-6">
        <span className="eyebrow text-faint">{longDate(now)}</span>
        <h1 className="lowercase m-0 font-display text-5xl leading-[0.95] tracking-[-0.045em] md:text-[64px]">
          {greeting()}, <em className="not-italic text-vermilion">Tato.</em>
        </h1>
        <p className="m-0 text-[15px] text-muted">Tres cosas importan hoy. El resto puede esperar.</p>
      </header>

      <section aria-label="Hoy" className="mt-7 flex flex-wrap gap-5">
        <div className="glass min-w-0 flex-[7_1_480px] rounded-[20px] p-7">
          <Priorities items={prios.map((p) => ({ id: p.id, title: p.title, area: p.area, done: p.done }))} areas={pillars.map((p) => p.name)} />
        </div>
        <div className="glass flex min-w-0 flex-[5_1_340px] flex-col gap-2 rounded-[20px] p-6">
          <div className="mb-1 flex items-baseline justify-between">
            <span className="eyebrow text-faint">Hábitos de hoy</span>
            <Link href="/habits" className="text-[13px]">Ver hábitos →</Link>
          </div>
          <TodayChecklist items={habits.habits} date={now} compact />
        </div>
      </section>

      {(moving.length > 0 || pillars.length > 0) && (
        <section aria-label="Proyectos y equilibrio" className="mt-5 flex flex-wrap gap-5">
          <div className="flex min-w-0 flex-[7_1_480px] flex-col gap-3.5">
            <div className="flex items-baseline justify-between">
              <span className="eyebrow text-faint">Proyectos en movimiento</span>
              <Link href="/projects" className="text-[13px]">Todos los proyectos →</Link>
            </div>
            {moving.length ? (
              <div className="flex flex-wrap gap-3.5">
                {moving.map((p) => (
                  <Link key={p.id} href={`/projects/${p.id}`} className="glass flex min-w-0 flex-[1_1_200px] flex-col gap-2.5 rounded-[18px] px-[18px] py-4 text-ink no-underline">
                    <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-faint">{p.pillar?.name ?? "Proyecto"}</span>
                    <span className="font-display text-[22px] leading-tight">{p.name}</span>
                    <span className="truncate text-xs text-muted">{p.nextTask ? `Próximo: ${p.nextTask}` : p.nextMilestone ? `Hito: ${p.nextMilestone.title}` : "Sin tareas en curso"}</span>
                    <span className="flex items-center gap-2.5">
                      <span className="h-1 flex-1 overflow-hidden rounded bg-white/[0.08]"><span className="block h-full bg-vermilion" style={{ width: `${p.progress}%` }} /></span>
                      <span className="font-mono text-[11px] text-[#C9C5BC]">{p.progress}%</span>
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <Link href="/projects" className="glass rounded-[18px] px-5 py-6 text-sm text-muted no-underline">Aún no tienes proyectos activos. Crear uno →</Link>
            )}
          </div>
          <Link href="/strategy" className="glass flex min-w-0 flex-[5_1_340px] flex-col gap-3.5 rounded-[20px] p-6 text-ink no-underline">
            <span className="eyebrow text-faint">Equilibrio de vida · este mes</span>
            {pillars.length ? (
              pillars.map((pl) => (
                <span key={pl.id} className="flex flex-col gap-1.5">
                  <span className="flex justify-between text-sm">
                    <span>{pl.name}</span>
                    <span className="font-mono text-xs text-muted">{pl.score ?? "—"}{pl.delta != null && <span className={pl.delta >= 0 ? "text-[#FF8A55]" : ""}> {pl.delta >= 0 ? `+${pl.delta}` : pl.delta}</span>}</span>
                  </span>
                  <span className="h-1.5 overflow-hidden rounded bg-white/[0.08]"><span className="block h-full rounded" style={{ width: `${pl.score ?? 0}%`, background: (pl.score ?? 0) >= 75 ? "#FF572E" : "#F4EADB" }} /></span>
                </span>
              ))
            ) : (
              <span className="text-sm text-muted">Define tus pilares en Strategy →</span>
            )}
          </Link>
        </section>
      )}

      <section aria-label="Journal y consistencia" className="mt-5 flex flex-wrap gap-5">
        <Link href={last ? `/journal?date=${last.date}` : "/journal"} className="flex min-w-0 flex-[7_1_480px] overflow-hidden rounded-[20px] bg-cream text-[#2B2420] no-underline">
          {lastImg && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={lastImg} alt="" className="block min-h-48 w-[38%] object-cover" />
          )}
          <span className="flex flex-col justify-center gap-2.5 px-7 py-6">
            <span className="font-mono text-[11px] tracking-[0.14em] text-[#8A5A3C]">{last ? "ÚLTIMA ENTRADA" : "JOURNAL"}</span>
            <span className="font-display text-[26px] leading-tight">
              {last ? last.title || entryText(last.blocks).slice(0, 120) || "Sin título" : "Escribe tu primera entrada de hoy."}
            </span>
            <span className="text-[13px] text-[#5E5047]">{last ? longDate(last.date) : "Abrir el journal →"}</span>
          </span>
        </Link>
        <Link href="/habits" className="glass flex min-w-0 flex-[5_1_300px] flex-col gap-4 rounded-[20px] p-6 text-ink no-underline">
          <span className="eyebrow text-faint">Consistencia · 5 semanas</span>
          <span className="flex items-baseline gap-2.5">
            <span className="font-display text-[64px] leading-[0.9] text-vermilion">{topStreak.streak}</span>
            <span className="text-sm text-muted">{topStreak.streak ? `días seguidos · ${topStreak.name}` : "días de racha · empieza hoy"}</span>
          </span>
          <span className="grid max-w-[300px] grid-cols-7 gap-[5px]">
            {heat.map((l, i) => <span key={i} className="block h-7 rounded" style={{ background: LEVELS[l] }} />)}
          </span>
        </Link>
      </section>

      <section aria-label="Año" className="mt-5 flex flex-wrap gap-5">
        {yearAgo && (
          <Link href={`/journal?date=${yearAgo.date}`} className="glass-warm flex min-w-0 flex-[7_1_480px] flex-col justify-center gap-2 rounded-[20px] px-7 py-6 text-cream no-underline">
            <span className="font-mono text-[11px] tracking-[0.14em] text-[#FF8A55]">HACE UN AÑO, HOY</span>
            <span className="font-display text-2xl leading-tight">{yearAgo.title || entryText(yearAgo.blocks).slice(0, 160)}</span>
          </Link>
        )}
        <div className="glass flex min-w-0 flex-[5_1_340px] flex-col justify-between gap-4 rounded-[20px] p-6">
          <span className="eyebrow text-faint">{now.slice(0, 4)} en curso</span>
          <span className="flex items-baseline gap-3">
            <span className="font-display text-[72px] leading-[0.9]">{yp.pct}%</span>
            <span className="text-sm text-muted">del año vivido · {yp.daysLeft} días restantes</span>
          </span>
          <span className="grid grid-cols-12 gap-1">
            {MONTHS_SHORT.map((m, i) => (
              <span key={m} className="flex flex-col items-center gap-1.5">
                <span className="block h-7 w-full rounded" style={{ background: i < month ? "#F4EADB" : i === month ? "#FF572E" : "rgba(255,255,255,0.08)" }} />
                <span className="font-mono text-[10px] text-faint">{m[0]}</span>
              </span>
            ))}
          </span>
        </div>
      </section>

      <p className="mt-10 text-center font-mono text-[11px] tracking-[0.5em] text-[#6E6862]">LIVE INTENTIONALLY.</p>
    </>
  );
}
