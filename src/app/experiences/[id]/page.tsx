import Link from "next/link";
import { notFound } from "next/navigation";
import { ExperienceEditor } from "@/components/experiences/ExperienceEditor";
import { SectionTitle } from "@/components/ui";
import { dayNum, dowShort } from "@/lib/dates";
import { getExperience } from "@/lib/experiences";

export const dynamic = "force-dynamic";

export default async function ExperiencePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const e = await getExperience(Number(id));
  if (!e) notFound();
  return (
    <>
      <div className="flex items-center justify-between">
        <span className="eyebrow text-faint">07 — Experiences</span>
        <Link href="/experiences" className="text-sm">← Todas las experiencias</Link>
      </div>
      <ExperienceEditor
        key={e.id}
        e={{ id: e.id, kind: e.kind, title: e.title, date: e.date, endDate: e.endDate, rating: e.rating, note: e.note, withWhom: e.withWhom, place: e.place, lat: e.lat, lng: e.lng, cover: e.cover, wishlist: e.wishlist, gallery: e.gallery }}
      />
      {e.kind === "viaje" && e.date && (
        <section aria-label="Del journal" className="glass-warm mt-6 rounded-[22px] px-7 py-6">
          <SectionTitle right={<span className="text-[13px] text-umber">lo que escribiste esos días</span>}>del journal</SectionTitle>
          {e.journal.length ? (
            <div className="flex flex-wrap gap-3.5">
              {e.journal.map((j) => (
                <Link key={j.date} href={`/journal?date=${j.date}`} className="flex min-w-0 flex-[1_1_240px] flex-col gap-1.5 rounded-[18px] border border-[rgba(255,214,180,0.12)] px-5 py-4 text-cream no-underline">
                  <span className="font-mono text-[10px] tracking-[0.12em] text-umber">{dowShort(j.date)} {dayNum(j.date)}</span>
                  <span className="font-serif text-xl leading-tight">{j.title || "Sin título"}</span>
                  <span className="line-clamp-3 font-serif text-[15px] text-sand">{j.excerpt}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="m-0 text-sm text-umber">No hay entradas del journal entre estas fechas.</p>
          )}
          {e.journalPhotos.length > 0 && (
            <>
              <span className="eyebrow mt-6 block text-umber">Fotos de esos días</span>
              <div className="mt-3 grid grid-cols-3 gap-2.5 md:grid-cols-6">
                {e.journalPhotos.map((p) => (
                  <Link key={p.id} href={`/journal?date=${p.date}`} className="block aspect-square overflow-hidden rounded-xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.url} alt="" className="h-full w-full object-cover" />
                  </Link>
                ))}
              </div>
            </>
          )}
        </section>
      )}
    </>
  );
}
