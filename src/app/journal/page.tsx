import Link from "next/link";
import { CaptureBar } from "@/components/journal/CaptureBar";
import { EntryEditor } from "@/components/journal/EntryEditor";
import { Fragments } from "@/components/journal/Fragments";
import { JournalTabs } from "@/components/journal/JournalTabs";
import { addDays, dayNum, dowShort, isValidISODate, longDate, today } from "@/lib/dates";
import { entryText, getEntry, getFragments, getOneYearAgo, getRecentDays, mediaMap, moodColor, MOODS } from "@/lib/journal";

export const dynamic = "force-dynamic";

export default async function JournalPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const sp = await searchParams;
  const now = today();
  const date = isValidISODate(sp.date) && sp.date <= now ? sp.date : now;
  const [entry, days, frags, yearAgo] = await Promise.all([getEntry(date), getRecentDays(14), getFragments(date), getOneYearAgo(date)]);
  const imageIds = (entry?.blocks ?? []).flatMap((b) => (b.type === "image" ? [b.mediaId] : []));
  const media = await mediaMap(imageIds);

  const rail = days.some((d) => d.date === now) ? days : [{ date: now, title: "Hoy", meta: "Nueva entrada", mood: undefined }, ...days];
  const prev = addDays(date, -1);
  const next = addDays(date, 1);

  return (
    <>
      <header className="flex flex-col pt-2">
        <span className="eyebrow text-umber">04 — Journal</span>
        <h1 className="lowercase m-0 mt-2.5 font-display text-5xl leading-[0.95] tracking-[-0.045em] text-cream md:text-[64px]">
          {date === now ? "Hoy," : `${longDate(date).split(" de ")[0]},`} <em className="not-italic text-[#FF8A55]">en fragmentos.</em>
        </h1>
        <JournalTabs active="hoy" />
      </header>

      <section aria-label="Entrada del día" className="mt-7 flex flex-wrap items-start gap-5">
        <nav aria-label="Días" className="flex min-w-0 flex-[1_1_200px] flex-col gap-1">
          <div className="flex items-center justify-between px-2.5 pb-2.5">
            <span className="eyebrow text-umber">Días</span>
            <span className="flex gap-1">
              <Link href={`/journal?date=${prev}`} aria-label="Día anterior" className="flex h-9 w-9 items-center justify-center rounded-lg text-sand hover:bg-white/5">‹</Link>
              {next <= now && (
                <Link href={`/journal?date=${next}`} aria-label="Día siguiente" className="flex h-9 w-9 items-center justify-center rounded-lg text-sand hover:bg-white/5">›</Link>
              )}
            </span>
          </div>
          {rail.map((d) => {
            const on = d.date === date;
            return (
              <Link
                key={d.date}
                href={d.date === now ? "/journal" : `/journal?date=${d.date}`}
                aria-current={on ? "page" : undefined}
                className={`flex min-h-14 items-center gap-3 rounded-2xl px-2.5 py-2 text-cream no-underline ${on ? "bg-[#2A211B]" : "hover:bg-white/[0.03]"}`}
              >
                <span className="flex w-9 flex-col items-center">
                  <span className="font-mono text-[10px] text-umber">{dowShort(d.date)}</span>
                  <span className={`font-display text-2xl leading-none ${on ? "text-[#FF8A55]" : ""}`}>{dayNum(d.date)}</span>
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-[13px]">{d.title}</span>
                  <span className="text-[11px] text-umber">{d.meta}</span>
                </span>
                <span aria-hidden="true" className="h-2 w-2 flex-none rounded-full" style={{ background: d.mood ? moodColor(d.mood) : "transparent" }} />
              </Link>
            );
          })}
        </nav>

        <EntryEditor
          key={date}
          date={date}
          dateLabel={longDate(date).toUpperCase()}
          initial={{ title: entry?.title ?? "", blocks: entry?.blocks ?? [], moods: entry?.moods ?? [], location: entry?.location ?? "" }}
          initialMedia={media}
          moods={MOODS}
        />

        <aside aria-label="Fragmentos del día" className="flex min-w-0 flex-[2_1_280px] flex-col gap-3.5">
          <span className="eyebrow px-1 text-umber">Fragmentos {date === now ? "de hoy" : "del día"}</span>
          <Fragments items={frags} />
          {yearAgo && (
            <Link href={`/journal?date=${yearAgo.date}`} className="glass-warm flex flex-col gap-1 rounded-[18px] px-5 py-4 text-cream no-underline">
              <span className="font-mono text-[10px] tracking-[0.12em] text-[#FF8A55]">HACE UN AÑO, HOY</span>
              <span className="text-sm leading-snug">{yearAgo.title || entryText(yearAgo.blocks).slice(0, 120) || "Ver la entrada"}</span>
            </Link>
          )}
          <div className="flex flex-col gap-2 rounded-[18px] bg-vermilion px-5 py-4 text-[#1A1512]">
            <span className="font-mono text-[10px] tracking-[0.12em]">PREGUNTA PARA HOY</span>
            <span className="font-display text-2xl leading-[1.1]">{QUESTIONS[Number(date.slice(8)) % QUESTIONS.length]}</span>
          </div>
        </aside>
      </section>

      <CaptureBar date={date} />
    </>
  );
}

const QUESTIONS = [
  "¿Qué momento de hoy quisieras recordar en un año?",
  "¿Qué te dio energía hoy y qué te la quitó?",
  "¿En qué estuviste realmente presente?",
  "¿Qué harías distinto si repitieras el día?",
  "¿Qué aprendiste sobre ti?",
  "¿A quién le agradeces algo hoy?",
  "¿Qué estás evitando pensar?",
];
