import Link from "next/link";
import { JournalTabs } from "@/components/journal/JournalTabs";
import { monthKey, MONTHS, today, weekOfYear } from "@/lib/dates";
import { getEntryDates, getMonthSnapshots } from "@/lib/journal";

export const dynamic = "force-dynamic";

export default async function TiempoPage() {
  const now = today();
  const year = Number(now.slice(0, 4));
  const from = Math.floor(year / 10) * 10;
  const [dates, snaps] = await Promise.all([getEntryDates(from, from + 9), getMonthSnapshots(monthKey(now), 6)]);
  const written = new Set(dates.map((d) => `${d.slice(0, 4)}-${weekOfYear(d)}`));
  const nowWeek = weekOfYear(now);

  return (
    <>
      <header className="flex flex-col pt-2">
        <span className="eyebrow text-umber">04 — Journal · Tiempo</span>
        <h1 className="lowercase m-0 mt-2.5 font-display text-5xl leading-[0.95] tracking-[-0.045em] text-cream md:text-[64px]">
          El tiempo, <em className="not-italic text-[#FF8A55]">a la vista.</em>
        </h1>
        <JournalTabs active="tiempo" />
      </header>

      <section aria-label="Meses recientes" className="mt-7">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="lowercase m-0 font-display text-[30px] text-cream">Cada mes, en tres palabras</h2>
          <span className="text-[13px] text-umber">Sale de tus revisiones mensuales</span>
        </div>
        <div className="flex flex-wrap gap-3.5">
          {snaps.map((s) => (
            <Link
              key={s.month}
              href={`/journal/mes?m=${s.month}`}
              className="relative flex min-h-56 min-w-0 flex-[1_1_180px] flex-col justify-end overflow-hidden rounded-[20px] border text-cream no-underline"
              style={{ borderColor: s.month === monthKey(now) ? "#FF572E" : "rgba(255,214,180,0.12)", background: "rgba(52,34,24,0.42)" }}
            >
              {s.cover && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
              )}
              <span aria-hidden="true" className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(15,11,9,0) 30%, rgba(15,11,9,0.9) 100%)" }} />
              <span className="relative flex flex-col gap-1.5 p-[18px]">
                <span className="font-mono text-[10px] tracking-[0.12em] text-[#FFB08A]">{MONTHS[Number(s.month.slice(5)) - 1].toUpperCase()}</span>
                <span className="font-display text-[22px] leading-tight">{s.words || "—"}</span>
                <span className="text-xs text-sand">{s.entries} entradas · {s.photos} fotos</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section aria-label="La década en semanas" className="glass-warm mt-5 rounded-[22px] px-7 py-6">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="lowercase m-0 font-display text-[30px] text-cream">La década en semanas</h2>
          <span className="flex flex-wrap gap-4 text-xs text-umber">
            <Legend c="#5A4A3E">Vivida</Legend>
            <Legend c="#F4EADB">Con entradas</Legend>
            <Legend c="#FF572E">Esta semana</Legend>
          </span>
        </div>
        <div className="overflow-x-auto">
          <div className="flex min-w-[820px] flex-col gap-1">
            {Array.from({ length: 10 }, (_, r) => from + r).map((y) => (
              <div key={y} className="flex items-center gap-3">
                <span className="w-9 font-mono text-[10px] text-umber">{y}</span>
                <span className="grid flex-1 grid-cols-[repeat(52,minmax(0,1fr))] gap-[3px]">
                  {Array.from({ length: 52 }, (_, w) => {
                    const isNow = y === year && w === nowWeek;
                    const past = y < year || (y === year && w < nowWeek);
                    const bg = isNow ? "#FF572E" : written.has(`${y}-${w}`) ? "#F4EADB" : past ? "#5A4A3E" : "rgba(255,255,255,0.06)";
                    return <span key={w} className="block h-2.5 rounded-[2px]" style={{ background: bg }} />;
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="glass-warm mt-5 rounded-[22px] px-7 py-6">
        <span className="eyebrow text-[#FF8A55]">Próximamente</span>
        <p className="m-0 mt-2 font-display text-2xl text-cream">Capítulos de tu vida: etapas con su imagen y lo que definió cada una.</p>
      </section>
    </>
  );
}

function Legend({ c, children }: { c: string; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5">
      <span aria-hidden="true" className="h-[9px] w-[9px] rounded-[2px]" style={{ background: c }} />
      {children}
    </span>
  );
}
