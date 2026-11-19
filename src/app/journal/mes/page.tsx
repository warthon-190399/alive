import Link from "next/link";
import { JournalTabs } from "@/components/journal/JournalTabs";
import { ReviewForm } from "@/components/journal/ReviewForm";
import { addMonths, dayNum, dowShort, monthKey, MONTHS, MONTHS_SHORT, today } from "@/lib/dates";
import { entryText, getMonth, moodColor } from "@/lib/journal";

export const dynamic = "force-dynamic";

// Patrón de mosaico: [columnas, filas] para cada posición del collage
const SPANS: [number, number][] = [[2, 3], [2, 2], [1, 2], [1, 2], [2, 1], [2, 2], [1, 1], [1, 1], [2, 1]];

export default async function MesPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const sp = await searchParams;
  const current = monthKey(today());
  const month = sp.m && /^\d{4}-\d{2}$/.test(sp.m) && sp.m <= current ? sp.m : current;
  const data = await getMonth(month);
  const strip = Array.from({ length: 6 }, (_, i) => addMonths(month, i - 5)).filter((m) => m <= current);
  const mIdx = Number(month.slice(5)) - 1;
  const totalMoods = Object.values(data.moods).reduce((a, b) => a + b, 0);

  return (
    <>
      <header className="flex flex-col pt-2">
        <span className="eyebrow text-umber">04 — Journal · Mes</span>
        <h1 className="lowercase m-0 mt-2.5 font-display text-5xl leading-[0.95] tracking-[-0.045em] text-cream md:text-[64px]">
          {MONTHS[mIdx][0].toUpperCase() + MONTHS[mIdx].slice(1)}, <em className="not-italic text-[#FF8A55]">en una mirada.</em>
        </h1>
        <JournalTabs active="mes" />
      </header>

      <nav aria-label="Mes" className="mt-6 flex flex-wrap gap-2">
        {strip.map((m) => (
          <Link
            key={m}
            href={`/journal/mes?m=${m}`}
            aria-current={m === month ? "page" : undefined}
            className={`flex h-11 min-w-16 items-center justify-center rounded-full px-3.5 font-mono text-xs no-underline ${m === month ? "bg-cream text-[#140E0A]" : "border border-[rgba(255,214,180,0.14)] text-sand"}`}
          >
            {MONTHS_SHORT[Number(m.slice(5)) - 1]}
          </Link>
        ))}
      </nav>

      <section aria-label="Collage del mes" className="mt-7">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="lowercase m-0 font-display text-[34px] text-cream">Collage · {MONTHS[mIdx]}</h2>
          <span className="text-[13px] text-umber">Se arma solo con lo que guardas · {data.entries.length} entradas · {data.images.length} imágenes</span>
        </div>
        {data.images.length ? (
          <div className="grid auto-rows-[120px] grid-cols-2 gap-3 md:grid-cols-6">
            {data.images.slice(0, SPANS.length).map((img, i) => (
              <Link
                key={img.id}
                href={`/journal?date=${img.date}`}
                className="overflow-hidden rounded-[18px]"
                style={{ gridColumn: `span ${SPANS[i][0]}`, gridRow: `span ${SPANS[i][1]}` }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={`Imagen del ${dayNum(img.date)}`} className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.03]" />
              </Link>
            ))}
          </div>
        ) : (
          <p className="glass-warm m-0 rounded-3xl px-6 py-10 text-center text-umber">Cuando guardes fotos en tus entradas o fragmentos, el collage de este mes aparecerá aquí.</p>
        )}
      </section>

      <section aria-label="Revisión del mes" className="mt-5 flex flex-wrap gap-5">
        <div className="flex min-w-0 flex-[3_1_440px] flex-col gap-4 rounded-[22px] bg-vermilion p-8 text-[#140E0A]">
          <span className="eyebrow">Revisión de {MONTHS[mIdx]}</span>
          <h2 className="lowercase m-0 font-display text-[44px] leading-none">Preguntas para cerrar el mes</h2>
          <ReviewForm key={month} period={month} initial={data.review} />
        </div>
        <div className="glass-warm flex min-w-0 flex-[2_1_340px] flex-col gap-3.5 rounded-[22px] p-7">
          <span className="eyebrow text-umber">El mes en datos</span>
          {[
            ["Entradas de journal", data.entries.length],
            ["Fotos e imágenes", data.images.length],
            ["Fragmentos", data.fragCount],
          ].map(([l, v]) => (
            <div key={l} className="flex items-baseline justify-between border-t border-[rgba(255,214,180,0.12)] py-2.5">
              <span className="text-sm text-sand">{l}</span>
              <span className="font-display text-[28px]">{v}</span>
            </div>
          ))}
          <span className="eyebrow mt-2 text-umber">Estados del mes</span>
          {totalMoods ? (
            <>
              <span className="flex h-3.5 overflow-hidden rounded-full">
                {Object.entries(data.moods).map(([m, n]) => (
                  <span key={m} title={`${m}: ${n}`} style={{ flex: n, background: moodColor(m) }} />
                ))}
              </span>
              <span className="flex flex-wrap gap-3 text-[11px] text-[#E4D6C3]">
                {Object.entries(data.moods).map(([m, n]) => (
                  <span key={m}>{m} · {n}</span>
                ))}
              </span>
            </>
          ) : (
            <span className="text-sm text-umber">Marca cómo te sientes en tus entradas para verlo aquí.</span>
          )}
        </div>
      </section>

      <section aria-label="Entradas del mes" className="mt-8">
        <h2 className="lowercase m-0 mb-4 font-display text-[30px] text-cream">Entradas</h2>
        <div className="flex flex-wrap gap-3.5">
          {data.entries.map((e) => (
            <Link key={e.date} href={`/journal?date=${e.date}`} className="glass-warm flex min-w-0 flex-[1_1_240px] flex-col gap-1.5 rounded-[18px] px-5 py-4 text-cream no-underline">
              <span className="font-mono text-[10px] tracking-[0.12em] text-umber">{dowShort(e.date)} {dayNum(e.date)}</span>
              <span className="font-display text-xl leading-tight">{e.title || "Sin título"}</span>
              <span className="line-clamp-2 text-[13px] text-sand">{entryText(e.blocks)}</span>
            </Link>
          ))}
          {!data.entries.length && <p className="m-0 text-umber">Sin entradas este mes.</p>}
        </div>
      </section>
    </>
  );
}
