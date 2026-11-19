"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { importImage, saveEntry, uploadImage } from "@/actions/journal";
import type { Block } from "@/db/schema";

type Props = {
  date: string;
  dateLabel: string;
  initial: { title: string; blocks: Block[]; moods: string[]; location: string };
  initialMedia: Record<number, string>;
  moods: { name: string; color: string }[];
};

const uid = () => Math.random().toString(36).slice(2, 10);

export function EntryEditor({ date, dateLabel, initial, initialMedia, moods }: Props) {
  const [title, setTitle] = useState(initial.title);
  const [blocks, setBlocks] = useState<Block[]>(initial.blocks.length ? initial.blocks : [{ id: uid(), type: "text", text: "" }]);
  const [selMoods, setSelMoods] = useState<string[]>(initial.moods);
  const [location, setLocation] = useState(initial.location);
  const [media, setMedia] = useState(initialMedia);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [urlOpen, setUrlOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [uploading, startUpload] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const first = useRef(true);

  // Autoguardado con espera de 800 ms tras el último cambio
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setStatus("saving");
    const t = setTimeout(async () => {
      try {
        await saveEntry(date, { title, blocks, moods: selMoods, location });
        setStatus("saved");
      } catch {
        setStatus("error");
      }
    }, 800);
    return () => clearTimeout(t);
  }, [date, title, blocks, selMoods, location]);

  const update = (id: string, patch: Partial<Block>) =>
    setBlocks((bs) => bs.map((b) => (b.id === id ? ({ ...b, ...patch } as Block) : b)));
  const remove = (id: string) => setBlocks((bs) => (bs.length > 1 ? bs.filter((b) => b.id !== id) : [{ id: uid(), type: "text", text: "" }]));
  const move = (id: string, dir: -1 | 1) =>
    setBlocks((bs) => {
      const i = bs.findIndex((b) => b.id === id);
      const j = i + dir;
      if (j < 0 || j >= bs.length) return bs;
      const c = bs.slice();
      [c[i], c[j]] = [c[j], c[i]];
      return c;
    });
  const add = (b: Block) => setBlocks((bs) => [...bs, b]);

  const addImageFiles = useCallback(
    (files: File[]) => {
      const imgs = files.filter((f) => f.type.startsWith("image/"));
      if (!imgs.length) return;
      setError(null);
      startUpload(async () => {
        for (const f of imgs) {
          try {
            const fd = new FormData();
            fd.set("date", date);
            fd.set("file", f);
            const r = await uploadImage(fd);
            if (!r.ok) {
              setError(r.error);
              continue;
            }
            setMedia((m) => ({ ...m, [r.id]: r.url }));
            setBlocks((bs) => [...bs, { id: uid(), type: "image", mediaId: r.id, caption: "" }]);
          } catch (e) {
            setError((e as Error).message);
          }
        }
      });
    },
    [date],
  );

  const addFromUrl = () => {
    const u = url.trim();
    if (!u) return;
    setError(null);
    startUpload(async () => {
      try {
        const r = await importImage(u, date);
        if (!r.ok) return setError(r.error);
        setMedia((m) => ({ ...m, [r.id]: r.url }));
        add({ id: uid(), type: "image", mediaId: r.id, caption: "" });
        setUrl("");
        setUrlOpen(false);
      } catch (e) {
        setError((e as Error).message);
      }
    });
  };

  const words = blocks.map((b) => (b.type === "image" ? b.caption : b.text)).join(" ").split(/\s+/).filter(Boolean).length;

  return (
    <article
      className="glass-warm flex min-w-0 flex-[4_1_520px] flex-col gap-5 rounded-3xl px-6 py-8 md:px-12 md:py-10"
      onPaste={(e) => {
        const files = Array.from(e.clipboardData.files);
        if (files.length) {
          e.preventDefault();
          addImageFiles(files);
        }
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        addImageFiles(Array.from(e.dataTransfer.files));
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="eyebrow text-umber">{dateLabel}</span>
          <label className="flex items-center gap-2 text-xs text-umber">
            <span className="sr-only">Lugar</span>
            <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="¿Dónde estás?" className="w-48 border-0 bg-transparent p-0 text-xs text-sand outline-none placeholder:text-umber/70" />
          </label>
        </div>
        <div role="group" aria-label="Estado de ánimo" className="flex flex-wrap justify-end gap-1.5">
          {moods.map((m) => {
            const on = selMoods.includes(m.name);
            return (
              <button
                key={m.name}
                type="button"
                aria-pressed={on}
                onClick={() => setSelMoods((s) => (on ? s.filter((x) => x !== m.name) : [...s, m.name]))}
                className={`min-h-9 rounded-xl px-3 text-xs transition-colors ${on ? "bg-vermilion font-semibold text-[#140E0A]" : "border border-[#5A4A3E] text-[#E4D6C3] hover:border-umber"}`}
              >
                {m.name}
              </button>
            );
          })}
        </div>
      </div>

      <label>
        <span className="sr-only">Título</span>
        <textarea
          value={title}
          onChange={(e) => setTitle(e.target.value.replace(/\n/g, " "))}
          placeholder="Título de hoy"
          rows={1}
          className="block w-full resize-none overflow-hidden border-0 bg-transparent p-0 font-serif text-4xl font-medium leading-[1.1] tracking-[-0.015em] text-cream md:text-[46px] outline-none placeholder:text-umber/50 md:text-5xl"
        />
      </label>

      {blocks.map((b, i) => (
        <div key={b.id} className="group relative">
          <div className="absolute -right-2 -top-3 z-10 flex gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
            <IconBtn label="Subir bloque" onClick={() => move(b.id, -1)} disabled={i === 0} d="M12 19V5M5 12l7-7 7 7" />
            <IconBtn label="Bajar bloque" onClick={() => move(b.id, 1)} disabled={i === blocks.length - 1} d="M12 5v14M5 12l7 7 7-7" />
            <IconBtn label="Eliminar bloque" onClick={() => remove(b.id)} d="M6 6l12 12M18 6L6 18" />
          </div>
          {b.type === "text" && (
            <textarea
              aria-label="Texto"
              value={b.text}
              onChange={(e) => update(b.id, { text: e.target.value })}
              placeholder={i === 0 ? "¿Qué pasó hoy? ¿Qué estás pensando?" : "Sigue escribiendo…"}
              rows={2}
              className="block min-h-16 w-full resize-none overflow-hidden border-0 bg-transparent p-0 font-serif text-[21px] leading-[1.65] text-[#E4D6C3] outline-none placeholder:text-umber/50"
            />
          )}
          {b.type === "image" && (
            <figure className="m-0 flex flex-col gap-2.5">
              {media[b.mediaId] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={media[b.mediaId]} alt={b.caption || "Imagen del journal"} className="block max-h-[520px] w-full rounded-2xl object-cover" />
              ) : (
                <div className="flex h-40 items-center justify-center rounded-2xl bg-black/20 text-sm text-umber">Imagen no encontrada</div>
              )}
              <input
                aria-label="Pie de foto"
                value={b.caption}
                onChange={(e) => update(b.id, { caption: e.target.value })}
                placeholder="Añade un pie de foto…"
                className="border-0 bg-transparent p-0 text-xs text-umber outline-none placeholder:text-umber/60"
              />
            </figure>
          )}
          {b.type === "quote" && (
            <blockquote className="m-0 flex flex-col gap-2.5 rounded-2xl bg-[#1A1512] px-7 py-6">
              <span aria-hidden="true" className="font-serif text-[64px] leading-[0.6] text-vermilion">“</span>
              <textarea
                aria-label="Cita"
                value={b.text}
                onChange={(e) => update(b.id, { text: e.target.value })}
                placeholder="Una frase que quieras guardar"
                rows={1}
                className="block w-full resize-none overflow-hidden border-0 bg-transparent p-0 font-serif text-[28px] italic leading-snug text-cream outline-none placeholder:text-umber/50"
              />
              <input
                aria-label="Fuente de la cita"
                value={b.source}
                onChange={(e) => update(b.id, { source: e.target.value })}
                placeholder="Autor o fuente"
                className="border-0 bg-transparent p-0 text-xs text-umber outline-none placeholder:text-umber/60"
              />
            </blockquote>
          )}
        </div>
      ))}

      {urlOpen && (
        <div className="flex flex-wrap gap-2">
          <label className="min-w-0 flex-1">
            <span className="sr-only">Enlace de la imagen</span>
            <input
              autoFocus
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addFromUrl()}
              placeholder="Pega el enlace de una imagen (https://…)"
              className="h-11 w-full rounded-xl border border-[#5A4A3E] bg-black/20 px-4 text-sm text-cream outline-none"
            />
          </label>
          <button type="button" onClick={addFromUrl} className="h-11 rounded-xl bg-cream px-4 text-sm font-semibold text-[#140E0A]">
            Traer imagen
          </button>
        </div>
      )}
      {error && <p role="alert" className="m-0 text-sm text-[#FFB08A]">{error}</p>}

      <div className="flex flex-wrap items-center gap-2 border-t border-[rgba(255,214,180,0.12)] pt-4">
        <AddBtn onClick={() => add({ id: uid(), type: "text", text: "" })}>Texto</AddBtn>
        <AddBtn onClick={() => fileRef.current?.click()}>{uploading ? "Subiendo…" : "Imagen"}</AddBtn>
        <AddBtn onClick={() => setUrlOpen((o) => !o)}>Desde la web</AddBtn>
        <AddBtn onClick={() => add({ id: uid(), type: "quote", text: "", source: "" })}>Cita</AddBtn>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            addImageFiles(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
        <span className="ml-auto font-mono text-[11px] text-umber" aria-live="polite">
          {words} PALABRAS · {status === "saving" ? "GUARDANDO…" : status === "error" ? "ERROR AL GUARDAR" : status === "saved" ? "GUARDADO" : "AL DÍA"}
        </span>
      </div>
      <p className="m-0 text-xs text-umber/80">Puedes pegar o arrastrar imágenes directamente aquí.</p>
    </article>
  );
}

function AddBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="h-10 rounded-xl border border-dashed border-[#5A4A3E] px-3.5 text-[13px] font-medium text-sand hover:border-umber hover:text-cream">
      + {children}
    </button>
  );
}

function IconBtn({ label, onClick, d, disabled }: { label: string; onClick: () => void; d: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-[rgba(255,214,180,0.18)] bg-[#241A14] text-sand hover:text-cream disabled:opacity-30"
    >
      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d={d} />
      </svg>
    </button>
  );
}
