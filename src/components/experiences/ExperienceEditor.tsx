"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { addToGallery, deleteExperience, removeFromGallery, updateExperience } from "@/actions/experiences";
import { ImagePicker } from "@/components/ImagePicker";
import { Stars } from "@/components/Stars";
import { KINDS } from "./ExperienceForm";
import { LocationSearch } from "./LocationSearch";
import { MapView } from "./MapView";
import { useRouter } from "next/navigation";

type Kind = (typeof KINDS)[number]["k"];
type E = {
  id: number; kind: Kind; title: string; date: string | null; endDate: string | null; rating: number | null; note: string; withWhom: string;
  place: string; lat: number | null; lng: number | null; cover?: string; wishlist: boolean; gallery: { id: number; url: string }[];
};

export function ExperienceEditor({ e }: { e: E }) {
  const router = useRouter();
  const [, start] = useTransition();
  const [f, setF] = useState({ title: e.title, kind: e.kind, date: e.date ?? "", endDate: e.endDate ?? "", rating: e.rating, note: e.note, withWhom: e.withWhom, place: e.place, lat: e.lat, lng: e.lng, wishlist: e.wishlist });
  const [cover, setCover] = useState(e.cover);
  const [gallery, setGallery] = useState(e.gallery);
  const [status, setStatus] = useState("");
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setStatus("Guardando…");
    const t = setTimeout(async () => {
      await updateExperience(e.id, { ...f, date: f.date || null, endDate: f.endDate || null });
      setStatus("Guardado");
    }, 700);
    return () => clearTimeout(t);
  }, [f, e.id]);

  const field = "h-10 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-ink outline-none placeholder:text-faint [color-scheme:dark]";

  return (
    <>
      <section className="glass mt-4 flex flex-wrap overflow-hidden rounded-[22px]">
        <div className="relative min-h-72 min-w-0 flex-[3_1_380px]">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div aria-hidden="true" className="absolute inset-0" style={{ background: "radial-gradient(circle at 40% 40%, rgba(255,87,46,0.6), rgba(169,47,39,0.35) 45%, rgba(20,20,20,0.9) 80%)" }} />
          )}
          <div className="absolute bottom-4 left-4 rounded-xl bg-black/55 p-2 backdrop-blur">
            <ImagePicker compact label="Portada" date={f.date || undefined} onPicked={(img) => { setCover(img.url); start(() => updateExperience(e.id, { coverMediaId: img.id })); }} />
          </div>
        </div>
        <div className="flex min-w-0 flex-[2_1_380px] flex-col gap-4 px-7 py-7">
          <div className="flex items-center justify-between">
            <label>
              <span className="sr-only">Tipo</span>
              <select value={f.kind} onChange={(ev) => setF({ ...f, kind: ev.target.value as Kind })} className="eyebrow h-9 rounded-lg border-0 bg-transparent text-[#FF8A55] outline-none">
                {KINDS.map((k) => <option key={k.k} value={k.k} className="bg-[#1c1b1a] text-ink">{k.l}</option>)}
              </select>
            </label>
            <span aria-live="polite" className="text-xs text-faint">{status}</span>
          </div>
          <label>
            <span className="sr-only">Título</span>
            <textarea value={f.title} rows={1} onChange={(ev) => setF({ ...f, title: ev.target.value.replace(/\n/g, " ") })} className="block w-full resize-none overflow-hidden border-0 bg-transparent p-0 font-display text-4xl leading-[1.05] outline-none" />
          </label>
          {f.wishlist ? (
            <div className="flex flex-wrap items-center gap-3 rounded-xl bg-vermilion/15 px-4 py-3 text-sm text-[#FFB08A]">
              En tu lista de deseos.
              <button type="button" onClick={() => setF({ ...f, wishlist: false, date: f.date || new Date().toISOString().slice(0, 10) })} className="h-9 rounded-full bg-vermilion px-3.5 text-xs font-bold text-obsidian">Lo viví ✓</button>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                <label className={`${field} flex flex-[1_1_150px] items-center gap-2 text-xs text-muted`}>{f.kind === "viaje" ? "Desde" : "Fecha"}
                  <input type="date" value={f.date} onChange={(ev) => setF({ ...f, date: ev.target.value })} className="min-w-0 flex-1 border-0 bg-transparent text-sm text-ink outline-none" />
                </label>
                {f.kind === "viaje" && (
                  <label className={`${field} flex flex-[1_1_150px] items-center gap-2 text-xs text-muted`}>Hasta
                    <input type="date" value={f.endDate} onChange={(ev) => setF({ ...f, endDate: ev.target.value })} className="min-w-0 flex-1 border-0 bg-transparent text-sm text-ink outline-none" />
                  </label>
                )}
              </div>
              <span className="flex items-center gap-2 text-xs text-muted">Calificación <Stars value={f.rating} onChange={(v) => setF({ ...f, rating: v })} size={22} /></span>
            </>
          )}
          <label>
            <span className="sr-only">Con quién</span>
            <input value={f.withWhom} onChange={(ev) => setF({ ...f, withWhom: ev.target.value })} placeholder="¿Con quién?" className={`${field} w-full`} />
          </label>
          <LocationSearch value={{ place: f.place, lat: f.lat, lng: f.lng }} onChange={(v) => setF({ ...f, ...v })} />
        </div>
      </section>

      <section aria-label="Nota" className="glass mt-5 rounded-[22px] px-8 py-7">
        <span className="eyebrow text-faint">Lo que quiero recordar</span>
        <label>
          <span className="sr-only">Nota</span>
          <textarea value={f.note} onChange={(ev) => setF({ ...f, note: ev.target.value })} rows={3} placeholder="Escribe lo que viviste, lo que sentiste, lo que no quieres olvidar…" className="mt-3 block w-full resize-none overflow-hidden border-0 bg-transparent p-0 font-serif text-[21px] leading-[1.6] text-[#E2DED6] outline-none placeholder:text-faint" />
        </label>
      </section>

      {f.lat != null && f.lng != null && (
        <section aria-label="Ubicación" className="mt-5">
          <MapView markers={[{ id: e.id, title: f.title, lat: f.lat, lng: f.lng, sub: f.place }]} height={300} zoom={13} />
        </section>
      )}

      <section aria-label="Galería" className="mt-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="m-0 font-display text-[30px] lowercase">galería</h2>
          <ImagePicker label="Foto" date={f.date || undefined} onPicked={(img) => { setGallery((g) => [...g, img]); start(() => addToGallery(e.id, img.id)); }} />
        </div>
        {gallery.length ? (
          <div className="grid auto-rows-[150px] grid-cols-2 gap-3 md:grid-cols-4">
            {gallery.map((g, i) => (
              <div key={g.id} className={`group relative overflow-hidden rounded-2xl ${i % 5 === 0 ? "col-span-2 row-span-2" : ""}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.url} alt="" className="h-full w-full object-cover" />
                <span className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                  <button type="button" onClick={() => { setCover(g.url); start(() => updateExperience(e.id, { coverMediaId: g.id })); }} className="h-8 rounded-full bg-black/60 px-3 text-xs text-white">Usar de portada</button>
                  <button type="button" aria-label="Quitar de la galería" onClick={() => { setGallery((x) => x.filter((y) => y.id !== g.id)); start(() => removeFromGallery(e.id, g.id)); }} className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white">×</button>
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="glass m-0 rounded-[20px] px-6 py-8 text-center text-muted">Sube fotos o trae imágenes desde un enlace.</p>
        )}
      </section>

      <div className="mt-8 flex justify-end">
        <button type="button" onClick={() => confirm(`¿Eliminar "${f.title}"?`) && start(async () => { await deleteExperience(e.id); router.push("/experiences"); })} className="h-10 rounded-lg px-3 text-sm text-muted hover:text-[#FFB08A]">Eliminar experiencia</button>
      </div>
    </>
  );
}
