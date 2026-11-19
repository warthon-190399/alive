"use client";

import { useRef, useState, useTransition } from "react";
import { addBoardImage, addBoardText, deleteBoardItem } from "@/actions/strategy";

type Item = { id: number; kind: "image" | "text"; text: string; url?: string };
const TEXT_STYLES = ["bg-vermilion text-obsidian", "bg-cream text-[#2B2420]", "glass text-ink"];
const SPANS = ["md:col-span-2 md:row-span-2", "md:col-span-2", "md:col-span-2 md:row-span-2", "", "", "md:col-span-2", "md:col-span-2 md:row-span-2", ""];

export function VisionBoard({ items }: { items: Item[] }) {
  const [pending, start] = useTransition();
  const [text, setText] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  let t = 0;
  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => fileRef.current?.click()} className="h-11 rounded-full border border-white/15 px-4 text-[13px] font-semibold">
          {pending ? "Subiendo…" : "+ Imagen"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            e.target.value = "";
            setErr(null);
            start(async () => {
              for (const f of files) {
                const fd = new FormData();
                fd.set("file", f);
                const r = await addBoardImage(fd);
                if (!r.ok) setErr(r.error);
              }
            });
          }}
        />
        <form
          className="flex min-w-60 flex-1 gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const v = text;
            setText("");
            start(() => addBoardText(v));
          }}
        >
          <label className="flex-1">
            <span className="sr-only">Frase para el vision board</span>
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Una frase o una imagen mental: “Un estudio propio, con ventanas grandes.”" className="h-11 w-full rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm outline-none placeholder:text-faint" />
          </label>
          <button type="submit" className="h-11 rounded-full bg-white/10 px-4 text-[13px] font-semibold">Añadir frase</button>
        </form>
      </div>
      {err && <p role="alert" className="mb-3 text-sm text-[#FFB08A]">{err}</p>}
      {items.length ? (
        <div className="grid auto-rows-[120px] grid-cols-2 gap-3 md:grid-cols-6">
          {items.map((it, i) => (
            <div key={it.id} className={`group relative overflow-hidden rounded-2xl ${SPANS[i % SPANS.length]}`}>
              {it.kind === "image" && it.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={it.url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className={`flex h-full items-end p-5 ${TEXT_STYLES[t++ % TEXT_STYLES.length]}`}>
                  <span className="text-xl font-bold leading-tight tracking-[-0.03em]">{it.text}</span>
                </div>
              )}
              <button
                type="button"
                aria-label="Quitar del vision board"
                onClick={() => start(() => deleteBoardItem(it.id))}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="glass m-0 rounded-[20px] px-6 py-10 text-center text-muted">Tu vision board está vacío. Sube imágenes que te inspiren o escribe frases sobre la vida que quieres.</p>
      )}
    </>
  );
}
