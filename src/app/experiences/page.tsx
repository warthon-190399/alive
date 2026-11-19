import Link from "next/link";
import { ExperienceForm } from "@/components/experiences/ExperienceForm";
import { LivedButton } from "@/components/experiences/LivedButton";
import { MapView } from "@/components/experiences/MapView";
import { Stars } from "@/components/Stars";
import { PageHeader, SectionTitle } from "@/components/ui";
import { MONTHS_SHORT, today } from "@/lib/dates";
import { getExperiences, KIND_LABEL, type ExperienceView } from "@/lib/experiences";

export const dynamic = "force-dynamic";

const FILTERS = [
  { k: "", l: "Todo" },
  { k: "viaje", l: "Viajes" },
  { k: "lugar", l: "Lugares" },
  { k: "pelicula", l: "Películas" },
  { k: "libro", l: "Libros" },
  { k: "concierto", l: "Conciertos" },
  { k: "momento", l: "Momentos" },
];

export default async function ExperiencesPage({ searchParams }: { searchParams: Promise<{ tipo?: string; anio?: string }> }) {
  const sp = await searchParams;
  const now = today();
  const all = await getExperiences();
  const lived = all.filter((e) => !e.wishlist);
  const wish = all.filter((e) => e.wishlist);
  const years = [...new Set(lived.map((e) => e.date?.slice(0, 4)).filter(Boolean) as string[])].sort().reverse();
  const tipo = FILTERS.some((f) => f.k === sp.tipo) ? sp.tipo! : "";
  const anio = sp.anio && years.includes(sp.anio) ? sp.anio : "";
  const shown = lived.filter((e) => (!tipo || e.kind === tipo) && (!anio || e.date?.startsWith(anio)));
  const thisYear = now.slice(0, 4);
  const yearLived = lived.filter((e) => e.date?.startsWith(thisYear));
  const count = (k: string) => yearLived.filter((e) => e.kind === k).length;
  const trips = lived.filter((e) => e.kind === "viaje").sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));
  const mapped = shown.filter((e) => e.lat != null && e.lng != null);
  const href = (t: string, a: string) => {
    const q = new URLSearchParams();
    if (t) q.set("tipo", t);
    if (a) q.set("anio", a);
    const s = q.toString();
    return s ? `/experiences?${s}` : "/experiences";
  };

  return (
    <>
      <PageHeader eyebrow="07 — Experiences" title="lo que he" accent="vivido.">
        <div className="flex flex-wrap gap-7">
          <Kpi v={count("viaje")} l={`viajes en ${thisYear}`} />
          <Kpi v={count("lugar")} l="lugares" />
          <Kpi v={count("pelicula")} l="películas" />
          <Kpi v={count("libro")} l="libros" accent />
        </div>
      </PageHeader>

      <div className="mt-7"><ExperienceForm today={now} /></div>

      <nav aria-label="Filtrar" className="mt-6 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <Link key={f.k} href={href(f.k, anio)} aria-current={tipo === f.k ? "page" : undefined} className={`flex h-10 items-center rounded-full border px-4 text-[13px] no-underline ${tipo === f.k ? "border-ink bg-ink font-semibold text-obsidian" : "border-white/15 text-[#C9C5BC]"}`}>{f.l}</Link>
        ))}
        {years.length > 0 && (
          <span className="ml-auto flex gap-1.5">
            <Link href={href(tipo, "")} className={`flex h-10 items-center rounded-full px-3 font-mono text-xs no-underline ${!anio ? "bg-white/10 text-ink" : "text-muted"}`}>Todos</Link>
            {years.map((y) => (
              <Link key={y} href={href(tipo, y)} className={`flex h-10 items-center rounded-full px-3 font-mono text-xs no-underline ${anio === y ? "bg-white/10 text-ink" : "text-muted"}`}>{y}</Link>
            ))}
          </span>
        )}
      </nav>

      {trips.length > 0 && !tipo && (
        <section aria-label="Viajes en el tiempo" className="glass mt-6 rounded-[22px] px-7 py-6">
          <SectionTitle right={<span className="text-[13px] text-muted">{trips.length} viaje{trips.length > 1 ? "s" : ""}</span>}>viajes en el tiempo</SectionTitle>
          <div className="overflow-x-auto pb-2">
            <div className="relative flex min-w-max gap-8 px-1 pt-1">
              <span aria-hidden="true" className="absolute left-0 right-0 top-[86px] h-px bg-white/15" />
              {trips.map((t, i) => (
                <Link key={t.id} href={`/experiences/${t.id}`} className="relative flex w-28 flex-col gap-2 text-ink no-underline">
                  {t.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.cover} alt="" className="h-16 w-16 rounded-full border-2 object-cover" style={{ borderColor: i >= trips.length - 2 ? "#FF572E" : "#5A5852" }} />
                  ) : (
                    <span aria-hidden="true" className="h-16 w-16 rounded-full border-2" style={{ borderColor: "#5A5852", background: "radial-gradient(circle at 40% 40%, rgba(255,87,46,0.6), rgba(20,20,20,0.9))" }} />
                  )}
                  <span aria-hidden="true" className="ml-[27px] mt-1 h-2.5 w-2.5 rounded-full" style={{ background: i >= trips.length - 2 ? "#FF572E" : "#5A5852" }} />
                  <span className="truncate text-[13px]">{t.title}</span>
                  <span className="font-mono text-[10px] text-faint">{t.date ? `${MONTHS_SHORT[Number(t.date.slice(5, 7)) - 1]} ${t.date.slice(0, 4)}` : ""}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {mapped.length > 0 && (
        <section aria-label="Mapa" className="mt-6">
          <MapView markers={mapped.map((e) => ({ id: e.id, title: e.title, lat: e.lat!, lng: e.lng!, sub: `${KIND_LABEL[e.kind]}${e.place ? ` · ${e.place}` : ""}` }))} />
        </section>
      )}

      <section aria-label="Registro" className="mt-8">
        <SectionTitle right={<span className="text-[13px] text-muted">{shown.length} experiencia{shown.length === 1 ? "" : "s"}</span>}>registro</SectionTitle>
        {shown.length ? (
          <div className="grid auto-rows-[160px] grid-cols-2 gap-3.5 md:grid-cols-4">
            {shown.map((e, i) => <Card key={e.id} e={e} big={!!e.cover && (e.kind === "viaje" || i % 7 === 0)} />)}
          </div>
        ) : (
          <p className="glass m-0 rounded-[20px] px-6 py-10 text-center text-muted">Aún no hay experiencias {tipo ? "de este tipo" : ""}. Registra un lugar, una película o un viaje.</p>
        )}
      </section>

      {wish.length > 0 && (
        <section aria-label="Lista de deseos" className="mt-8">
          <SectionTitle right={<span className="text-[13px] text-muted">lo que quieres vivir</span>}>lista de deseos</SectionTitle>
          <div className="flex flex-wrap gap-3.5">
            {wish.map((w) => (
              <div key={w.id} className="flex min-w-0 flex-[1_1_220px] max-w-[360px] flex-col justify-between gap-4 rounded-[18px] bg-vermilion p-5 text-obsidian">
                <span className="font-mono text-[10px] uppercase tracking-[0.12em]">{KIND_LABEL[w.kind]}{w.place ? ` · ${w.place}` : ""}</span>
                <Link href={`/experiences/${w.id}`} className="font-display text-2xl leading-tight text-obsidian no-underline">{w.title}</Link>
                <LivedButton id={w.id} />
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function Kpi({ v, l, accent }: { v: number; l: string; accent?: boolean }) {
  return (
    <span className="flex flex-col">
      <span className={`font-display text-[40px] leading-none ${accent ? "text-vermilion" : ""}`}>{v}</span>
      <span className="text-xs text-muted">{l}</span>
    </span>
  );
}

const TEXT_CARD = ["bg-cream text-[#1A1512]", "bg-[#C4572A] text-[#FFF4EC]", "glass text-ink"];

function Card({ e, big }: { e: ExperienceView; big: boolean }) {
  const label = `${KIND_LABEL[e.kind]}${e.place ? ` · ${e.place}` : ""}`;
  const date = e.date ? `${e.date.slice(8, 10)}/${e.date.slice(5, 7)}/${e.date.slice(0, 4)}` : "";
  if (e.cover)
    return (
      <Link href={`/experiences/${e.id}`} className={`relative overflow-hidden rounded-[18px] text-ink no-underline ${big ? "col-span-2 row-span-2" : ""}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={e.cover} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 hover:scale-[1.03]" />
        <span className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-4" style={{ background: "linear-gradient(180deg, rgba(13,13,12,0) 0%, rgba(13,13,12,0.88) 100%)" }}>
          <span className="truncate font-mono text-[10px] uppercase tracking-[0.12em] text-[#FFB08A]">{label}</span>
          <span className={`font-display leading-tight ${big ? "text-[28px]" : "text-lg"}`}>{e.title}</span>
          <span className="flex items-center justify-between text-xs text-[#D6D2C9]"><span>{date}</span>{e.rating ? <Stars value={e.rating} size={12} /> : null}</span>
        </span>
      </Link>
    );
  return (
    <Link href={`/experiences/${e.id}`} className={`flex flex-col justify-between rounded-[18px] p-[18px] no-underline ${TEXT_CARD[e.id % TEXT_CARD.length]}`}>
      <span className="truncate font-mono text-[10px] uppercase tracking-[0.12em] opacity-80">{label}</span>
      <span className="font-display text-[22px] leading-tight">{e.title}</span>
      <span className="flex items-center justify-between text-xs opacity-80"><span>{date}</span>{e.rating ? <Stars value={e.rating} size={12} /> : null}</span>
    </Link>
  );
}
