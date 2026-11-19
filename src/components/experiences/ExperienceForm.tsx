"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { createExperience } from "@/actions/experiences";
import { ImagePicker } from "@/components/ImagePicker";
import { Stars } from "@/components/Stars";
import { LocationSearch } from "./LocationSearch";

type Kind = "viaje" | "lugar" | "pelicula" | "libro" | "concierto" | "momento";
export const KINDS: { k: Kind; l: string }[] = [
  { k: "viaje", l: "Viaje" },
  { k: "lugar", l: "Lugar" },
  { k: "pelicula", l: "Película" },
  { k: "libro", l: "Libro" },
  { k: "concierto", l: "Concierto" },
  { k: "momento", l: "Momento" },
];

const empty = (today: string) => ({ kind: "lugar" as Kind, title: "", date: today, endDate: "", rating: null as number | null, note: "", withWhom: "", place: "", lat: null as number | null, lng: null as number | null, wishlist: false });

export function ExperienceForm({ today }: { today: string }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(empty(today));
  const [cover, setCover] = useState<{ id: number; url: string } | null>(null);
  const [saved, setSaved] = useState<{ id: number; title: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const field = "h-10 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-ink outline-none placeholder:text-faint [color-scheme:dark]";
  const submit = () =>
    start(async () => {
      setErr(null);
      try {
        const r = await createExperience({ ...f, endDate: f.endDate || null, coverMediaId: cover?.id ?? null });
        if (!r.ok) return setErr(r.error);
        setSaved({ id: r.id, title: f.title });
        setF(empty(today));
        setCover(null);
        setOpen(false);
      } catch (e) {
        setErr((e as Error).message);
      }
    });

  if (!open)
    return (
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => setOpen(true)} className="h-11 rounded-full bg-vermilion px-5 text-sm font-bold text-obsidian">+ Registrar experiencia</button>
        {saved && (
          <span role="status" className="text-[13px] text-[#FFB08A]">
            Guardado: <Link href={`/experiences/${saved.id}`}>{saved.title} →</Link>
          </span>
        )}
      </div>
    );

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="glass flex flex-col gap-4 rounded-[22px] p-6">
      <div role="radiogroup" aria-label="Tipo" className="flex flex-wrap gap-1.5">
        {KINDS.map((k) => (
          <button key={k.k} type="button" role="radio" aria-checked={f.kind === k.k} onClick={() => setF({ ...f, kind: k.k })} className={`h-10 rounded-full px-4 text-[13px] ${f.kind === k.k ? "bg-ink font-semibold text-obsidian" : "border border-white/15 text-[#C9C5BC]"}`}>{k.l}</button>
        ))}
        <label className="ml-auto flex items-center gap-2 text-[13px] text-muted">
          <input type="checkbox" checked={f.wishlist} onChange={(e) => setF({ ...f, wishlist: e.target.checked })} className="h-4 w-4 accent-[#FF572E]" />
          Aún no lo vivo (lista de deseos)
        </label>
      </div>
      <label>
        <span className="sr-only">Título</span>
        <input required autoFocus value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder={f.kind === "viaje" ? "Tarapoto, selva alta" : f.kind === "pelicula" ? "Perfect Days" : f.kind === "libro" ? "Conversación en La Catedral" : "¿Qué viviste?"} className="w-full border-0 bg-transparent p-0 font-display text-3xl outline-none placeholder:text-faint" />
      </label>
      {!f.wishlist && (
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex flex-[1_1_150px] items-center gap-2 text-xs text-muted">{f.kind === "viaje" ? "Desde" : "Fecha"}
            <input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} className={field} />
          </label>
          {f.kind === "viaje" && (
            <label className="flex flex-[1_1_150px] items-center gap-2 text-xs text-muted">Hasta
              <input type="date" value={f.endDate} onChange={(e) => setF({ ...f, endDate: e.target.value })} className={field} />
            </label>
          )}
          <span className="flex items-center gap-2 text-xs text-muted">Calificación <Stars value={f.rating} onChange={(v) => setF({ ...f, rating: v })} /></span>
        </div>
      )}
      <LocationSearch value={{ place: f.place, lat: f.lat, lng: f.lng }} onChange={(v) => setF({ ...f, ...v })} />
      <label>
        <span className="sr-only">Con quién</span>
        <input value={f.withWhom} onChange={(e) => setF({ ...f, withWhom: e.target.value })} placeholder="¿Con quién?" className={field} />
      </label>
      <label>
        <span className="sr-only">Nota</span>
        <textarea value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} rows={2} placeholder="Lo que quieres recordar de esto…" className="block w-full resize-none overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 font-serif text-lg leading-snug outline-none placeholder:text-faint" />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover.url} alt="Portada elegida" className="h-16 w-16 rounded-xl object-cover" />
        )}
        <ImagePicker onPicked={setCover} date={f.date} />
      </div>
      {err && <p role="alert" className="m-0 text-sm text-[#FFB08A]">{err}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="h-11 rounded-full bg-vermilion px-5 text-sm font-bold text-obsidian disabled:opacity-50">{pending ? "Guardando…" : "Guardar"}</button>
        <button type="button" onClick={() => setOpen(false)} className="h-11 rounded-full px-4 text-sm text-muted">Cancelar</button>
      </div>
    </form>
  );
}
