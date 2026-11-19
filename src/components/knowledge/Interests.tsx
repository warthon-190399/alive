"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { archiveInterest, createInterest, updateInterest } from "@/actions/knowledge";
import { ImagePicker } from "@/components/ImagePicker";

type Stage = "curiosidad" | "explorando" | "profundizando";
type I = { id: number; name: string; question: string; stage: Stage; tags: string[]; openQuestions: number; queueCount: number; sparkCount: number; cover?: string };
const STAGES: { k: Stage; l: string; mark: string }[] = [
  { k: "curiosidad", l: "Curiosidad", mark: "○" },
  { k: "explorando", l: "Explorando", mark: "◐" },
  { k: "profundizando", l: "Profundizando", mark: "●" },
];
const LOOK: Record<Stage, { card: string; flex: string; size: string; tag: string }> = {
  profundizando: { card: "bg-vermilion text-obsidian border-vermilion", flex: "flex-[2_1_440px]", size: "text-4xl", tag: "border-black/30" },
  explorando: { card: "bg-cream text-[#1A1512] border-cream", flex: "flex-[1_1_300px]", size: "text-3xl", tag: "border-black/25" },
  curiosidad: { card: "glass text-ink", flex: "flex-[1_1_260px]", size: "text-[26px]", tag: "border-white/20" },
};

export function Interests({ items }: { items: I[] }) {
  const sorted = [...items].sort((a, b) => STAGES.findIndex((s) => s.k === b.stage) - STAGES.findIndex((s) => s.k === a.stage));
  return (
    <div className="flex flex-wrap gap-3.5">
      {sorted.map((i) => <Card key={i.id} i={i} />)}
      <form action={createInterest} className="flex min-h-[220px] min-w-0 max-w-[340px] flex-[1_1_260px] flex-col justify-center gap-2 rounded-[20px] border border-dashed border-white/15 p-6">
        <label>
          <span className="sr-only">Nuevo territorio</span>
          <input name="name" required placeholder="Nuevo territorio" className="w-full border-0 bg-transparent text-2xl font-bold tracking-[-0.03em] outline-none placeholder:text-faint" />
        </label>
        <label>
          <span className="sr-only">Pregunta guía</span>
          <input name="question" placeholder="¿Qué quieres entender de esto?" className="w-full border-0 bg-transparent text-[13px] text-muted outline-none placeholder:text-faint" />
        </label>
        <button type="submit" className="mt-2 h-10 w-fit rounded-full bg-white/10 px-4 text-[13px] font-semibold">Añadir territorio</button>
      </form>
    </div>
  );
}

export function Card({ i, detail = false }: { i: I; detail?: boolean }) {
  const [, start] = useTransition();
  const [tag, setTag] = useState("");
  const look = LOOK[i.stage];
  const [cover, setCover] = useState(i.cover);
  const addTag = () => {
    const t = tag.trim();
    setTag("");
    if (t && !i.tags.includes(t)) start(() => updateInterest(i.id, { tags: [...i.tags, t] }));
  };
  return (
    <article className={`group relative flex min-w-0 overflow-hidden rounded-[20px] border ${detail ? "min-h-[300px] flex-wrap" : `min-h-[220px] flex-col ${look.flex}`} ${look.card}`}>
      {!detail && cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cover} alt="" className="block h-28 w-full flex-none object-cover" />
      )}
      <div className={`flex min-w-0 flex-col gap-3 ${detail ? "flex-[3_1_420px] p-8" : "flex-1 p-6"}`}>
      <div className="flex items-center justify-between gap-2">
        <div role="radiogroup" aria-label="Nivel" className="flex gap-1">
          {STAGES.map((s) => (
            <button
              key={s.k}
              type="button"
              role="radio"
              aria-checked={i.stage === s.k}
              aria-label={s.l}
              title={s.l}
              onClick={() => start(() => updateInterest(i.id, { stage: s.k }))}
              className={`h-8 whitespace-nowrap rounded-full px-2.5 font-mono text-[10px] uppercase tracking-[0.1em] ${i.stage === s.k ? "bg-black/15 opacity-100" : "opacity-50 hover:opacity-100"}`}
            >
              {s.mark}{i.stage === s.k ? ` ${s.l}` : ""}
            </button>
          ))}
        </div>
        <button type="button" aria-label={`Archivar ${i.name}`} onClick={() => confirm(`¿Archivar "${i.name}"?`) && start(() => archiveInterest(i.id))} className="flex h-8 w-8 flex-none items-center justify-center rounded-lg opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100">
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 7h16v13H4zM2 3h20v4H2zM10 12h4" /></svg>
        </button>
      </div>
      <label>
        <span className="sr-only">Nombre del territorio</span>
        <textarea defaultValue={i.name} rows={1} onChange={(e) => (e.target.value = e.target.value.replace(/\n/g, " "))} onBlur={(e) => e.target.value !== i.name && start(() => updateInterest(i.id, { name: e.target.value }))} className={`block w-full resize-none overflow-hidden border-0 bg-transparent p-0 font-display ${detail ? "text-5xl" : look.size} leading-[1.05] text-current outline-none`} />
      </label>
      <label>
        <span className="sr-only">Pregunta guía</span>
        <textarea defaultValue={i.question} rows={2} placeholder="¿Qué quieres entender de esto?" onBlur={(e) => e.target.value !== i.question && start(() => updateInterest(i.id, { question: e.target.value }))} className="block w-full max-w-md resize-none overflow-hidden border-0 bg-transparent p-0 font-serif text-lg leading-snug text-current opacity-90 outline-none placeholder:text-current placeholder:opacity-50" />
      </label>
      <div className="mt-auto flex flex-wrap items-center gap-1.5">
        <span className="mr-1 font-mono text-[10px] uppercase tracking-[0.08em] opacity-70">{i.openQuestions} preg · {i.queueCount} en cola · {i.sparkCount} chispas</span>
        {i.tags.map((t) => (
          <span key={t} className={`flex items-center gap-1 rounded-[10px] border py-1 pl-2.5 pr-1 text-[11px] ${look.tag}`}>
            {t}
            <button type="button" aria-label={`Quitar ${t}`} onClick={() => start(() => updateInterest(i.id, { tags: i.tags.filter((x) => x !== t) }))} className="flex h-5 w-5 items-center justify-center rounded-full opacity-60 hover:opacity-100">×</button>
          </span>
        ))}
        <label>
          <span className="sr-only">Nueva etiqueta</span>
          <input value={tag} onChange={(e) => setTag(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }} onBlur={addTag} placeholder="+ etiqueta" className="h-7 w-24 border-0 bg-transparent text-[11px] text-current outline-none placeholder:text-current placeholder:opacity-50" />
        </label>
        {!detail && (
          <Link href={`/knowledge/${i.id}`} className="ml-auto flex h-9 items-center rounded-full border border-current/25 px-3.5 text-xs font-semibold text-current no-underline opacity-80 hover:opacity-100">
            Abrir →
          </Link>
        )}
      </div>
      </div>
      {detail && (
        <div className="relative min-h-60 min-w-0 flex-[2_1_300px]">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div aria-hidden="true" className="absolute inset-0" style={{ background: "radial-gradient(circle at 55% 45%, rgba(255,87,46,0.45), rgba(169,47,39,0.25) 45%, rgba(20,20,20,0) 80%)" }} />
          )}
          <div className="absolute bottom-4 left-4 flex items-center gap-1 rounded-xl bg-black/55 p-2 text-ink backdrop-blur">
            <ImagePicker compact label="Portada" onPicked={(img) => { setCover(img.url); start(() => updateInterest(i.id, { coverMediaId: img.id })); }} />
            {cover && (
              <button type="button" onClick={() => { setCover(undefined); start(() => updateInterest(i.id, { coverMediaId: null })); }} className="h-9 self-start rounded-lg px-3 text-xs text-muted hover:text-ink">Quitar</button>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
