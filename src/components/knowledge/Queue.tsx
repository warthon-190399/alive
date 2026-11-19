"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { createQueueItem, deleteQueueItem, setQueueStatus } from "@/actions/knowledge";
import { ImagePicker } from "@/components/ImagePicker";

type Item = { id: number; title: string; author: string; kind: string; url: string | null; status: "cola" | "explorando" | "terminado" | "abandonado"; interest: string | null; cover?: string; experienceId: number | null };
const KINDS = [
  { k: "libro", l: "Libro" },
  { k: "curso", l: "Curso" },
  { k: "paper", l: "Paper" },
  { k: "video", l: "Video" },
  { k: "podcast", l: "Podcast" },
  { k: "articulo", l: "Artículo" },
];
const COVER_BG: Record<string, string> = { libro: "#C4572A", curso: "#3A3935", paper: "#4A2A1C", video: "#2F3A44", podcast: "#5A3A2E", articulo: "#EDE6D8" };
const STATUS: Record<Item["status"], { l: string; c: string }> = {
  cola: { l: "En cola", c: "text-muted" },
  explorando: { l: "Explorando", c: "text-[#FF8A55]" },
  terminado: { l: "Terminado", c: "text-ink" },
  abandonado: { l: "Abandonado", c: "text-faint" },
};

export function Queue({ items, interests, fixedInterestId }: { items: Item[]; interests: { id: number; name: string }[]; fixedInterestId?: number }) {
  const [, start] = useTransition();
  const [form, setForm] = useState({ title: "", author: "", kind: "libro", url: "", interestId: fixedInterestId ? String(fixedInterestId) : "" });
  const [cover, setCover] = useState<{ id: number; url: string } | null>(null);
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState<number | null>(null);
  const active = items.filter((i) => i.status === "cola" || i.status === "explorando").sort((a, b) => (a.status === "explorando" ? -1 : 1) - (b.status === "explorando" ? -1 : 1));
  const past = items.filter((i) => i.status === "terminado" || i.status === "abandonado");

  const submit = () =>
    start(async () => {
      await createQueueItem({ ...form, interestId: Number(form.interestId) || null, coverMediaId: cover?.id ?? null });
      setForm({ title: "", author: "", kind: form.kind, url: "", interestId: form.interestId });
      setCover(null);
      setAdding(false);
    });

  return (
    <div className="flex flex-col">
      {notice && (
        <p role="status" className="mb-3 rounded-xl bg-vermilion/15 px-4 py-2.5 text-[13px] text-[#FFB08A]">
          Libro terminado: quedó registrado también en Experiences. <Link href={`/experiences/${notice}`}>Calificarlo →</Link>
        </p>
      )}
      {active.map((it) => (
        <Row key={it.id} it={it} onStatus={(s) => start(async () => { const r = await setQueueStatus(it.id, s); if (r.experienceId) setNotice(r.experienceId); })} onDelete={() => confirm(`¿Quitar "${it.title}"?`) && start(() => deleteQueueItem(it.id))} />
      ))}
      {!active.length && <p className="m-0 py-3 text-sm text-faint">Nada en cola. Añade un libro, curso o paper que quieras explorar.</p>}

      {adding ? (
        <form className="mt-3 flex flex-col gap-2 border-t border-white/[0.07] pt-4" onSubmit={(e) => { e.preventDefault(); submit(); }}>
          <div className="flex flex-wrap gap-2">
            <label className="min-w-0 flex-[2_1_200px]"><span className="sr-only">Título</span>
              <input autoFocus required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Título" className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm outline-none placeholder:text-faint" />
            </label>
            <label className="min-w-0 flex-[1_1_140px]"><span className="sr-only">Autor</span>
              <input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} placeholder="Autor o fuente" className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm outline-none placeholder:text-faint" />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="flex-[1_1_110px]"><span className="sr-only">Tipo</span>
              <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })} className="h-10 w-full rounded-xl border border-white/10 bg-[#1c1b1a] px-3 text-sm text-ink outline-none">
                {KINDS.map((k) => <option key={k.k} value={k.k}>{k.l}</option>)}
              </select>
            </label>
            {!fixedInterestId && <label className="flex-[1_1_140px]"><span className="sr-only">Territorio</span>
              <select value={form.interestId} onChange={(e) => setForm({ ...form, interestId: e.target.value })} className="h-10 w-full rounded-xl border border-white/10 bg-[#1c1b1a] px-3 text-sm text-ink outline-none">
                <option value="">Sin territorio</option>
                {interests.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </label>}
            <label className="min-w-0 flex-[2_1_180px]"><span className="sr-only">Enlace</span>
              <input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="Enlace (opcional)" className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm outline-none placeholder:text-faint" />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {cover && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover.url} alt="Portada elegida" className="h-14 w-10 rounded object-cover" />
            )}
            <ImagePicker onPicked={setCover} compact />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="h-10 rounded-xl bg-vermilion px-4 text-sm font-bold text-obsidian">Añadir a la cola</button>
            <button type="button" onClick={() => setAdding(false)} className="h-10 rounded-xl px-3 text-sm text-muted">Cancelar</button>
          </div>
        </form>
      ) : (
        <button type="button" onClick={() => setAdding(true)} className="mt-3 h-11 rounded-xl border border-dashed border-white/15 text-[13px] text-sand">+ Añadir a la cola</button>
      )}

      {past.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-muted">Terminados y abandonados ({past.length})</summary>
          <div className="mt-1">{past.map((it) => <Row key={it.id} it={it} onStatus={(s) => start(async () => { await setQueueStatus(it.id, s); })} onDelete={() => confirm(`¿Quitar "${it.title}"?`) && start(() => deleteQueueItem(it.id))} />)}</div>
        </details>
      )}
    </div>
  );
}

function Row({ it, onStatus, onDelete }: { it: Item; onStatus: (s: Item["status"]) => void; onDelete: () => void }) {
  const next: Partial<Record<Item["status"], { s: Item["status"]; l: string }[]>> = {
    cola: [{ s: "explorando", l: "Empezar" }],
    explorando: [{ s: "terminado", l: "Terminé" }, { s: "abandonado", l: "Lo dejo" }],
    terminado: [{ s: "explorando", l: "Retomar" }],
    abandonado: [{ s: "cola", l: "Volver a la cola" }],
  };
  return (
    <div className="group flex items-center gap-3.5 border-t border-white/[0.07] py-3">
      {it.cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={it.cover} alt="" className="h-12 w-9 flex-none rounded object-cover" />
      ) : (
        <span aria-hidden="true" className="flex h-12 w-9 flex-none items-end rounded p-1" style={{ background: COVER_BG[it.kind] }}>
          <span className="font-mono text-[7px] uppercase" style={{ color: it.kind === "articulo" ? "#2B2420" : "#F3F1EC" }}>{it.kind}</span>
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className={`truncate text-sm ${it.status === "abandonado" ? "text-faint line-through" : ""}`}>
          {it.url ? <a href={it.url} target="_blank" rel="noreferrer" className="text-ink no-underline hover:underline">{it.title}</a> : it.title}
        </span>
        <span className="truncate text-xs text-muted">{[it.author, it.interest].filter(Boolean).join(" · ")}</span>
      </span>
      <span className={`font-mono text-[10px] uppercase tracking-[0.08em] ${STATUS[it.status].c}`}>{STATUS[it.status].l}</span>
      <span className="flex gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
        {next[it.status]?.map((n) => (
          <button key={n.s} type="button" onClick={() => onStatus(n.s)} className="h-8 whitespace-nowrap rounded-lg border border-white/15 px-2.5 text-xs">{n.l}</button>
        ))}
        <button type="button" aria-label={`Quitar ${it.title}`} onClick={onDelete} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted">×</button>
      </span>
    </div>
  );
}
