"use client";

import { useRef, useState, useTransition } from "react";
import { importMedia, uploadMedia } from "@/actions/media";

/** Elegir una imagen: subir archivo, pegar archivo o traer desde un enlace. */
export function ImagePicker({ onPicked, label = "Portada", date, compact = false }: { onPicked: (img: { id: number; url: string }) => void; label?: string; date?: string; compact?: boolean }) {
  const [pending, start] = useTransition();
  const [url, setUrl] = useState("");
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);
  const upload = (f: File) =>
    start(async () => {
      setErr(null);
      try {
        const fd = new FormData();
        fd.set("file", f);
        if (date) fd.set("date", date);
        const r = await uploadMedia(fd);
        if (r.ok) onPicked({ id: r.id, url: r.url });
        else setErr(r.error);
      } catch {
        setErr("No se pudo subir la imagen");
      }
    });
  const fromUrl = () =>
    start(async () => {
      setErr(null);
      try {
        const r = await importMedia(url, date);
        if (!r.ok) return setErr(r.error);
        onPicked({ id: r.id, url: r.url });
        setUrl("");
        setOpen(false);
      } catch {
        setErr("No se pudo traer la imagen");
      }
    });
  const btn = compact ? "h-9 rounded-lg px-3 text-xs" : "h-10 rounded-xl px-3.5 text-[13px]";
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => ref.current?.click()} className={`${btn} border border-white/15 font-semibold`}>
          {pending ? "Guardando…" : `Subir ${label.toLowerCase()}`}
        </button>
        <button type="button" onClick={() => setOpen((o) => !o)} className={`${btn} border border-white/15 font-semibold`}>
          Desde enlace
        </button>
        <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) upload(f); }} />
      </div>
      {open && (
        <div className="flex gap-2">
          <label className="flex-1">
            <span className="sr-only">Enlace de la imagen</span>
            <input value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); fromUrl(); } }} placeholder="https://…/imagen.jpg" className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm outline-none placeholder:text-faint" />
          </label>
          <button type="button" onClick={fromUrl} className="h-10 rounded-xl bg-ink px-3.5 text-[13px] font-bold text-obsidian">Traer</button>
        </div>
      )}
      {err && <p role="alert" className="m-0 text-xs text-[#FFB08A]">{err}</p>}
    </div>
  );
}
