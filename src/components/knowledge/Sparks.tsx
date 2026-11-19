"use client";

import { useState, useTransition } from "react";
import { createSpark, deleteSpark } from "@/actions/knowledge";

type S = { id: number; kind: "idea" | "enlace" | "video"; text: string; url: string | null; interest: string | null; createdAt: string };
const KINDS = [
  { k: "idea", l: "Idea" },
  { k: "enlace", l: "Enlace" },
  { k: "video", l: "Video" },
] as const;

export function Sparks({ items, interests, fixedInterestId }: { items: S[]; interests: { id: number; name: string }[]; fixedInterestId?: number }) {
  const [, start] = useTransition();
  const [kind, setKind] = useState<S["kind"]>("idea");
  const [text, setText] = useState("");
  const [interestId, setInterestId] = useState(fixedInterestId ? String(fixedInterestId) : "");
  return (
    <div className="flex flex-col">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const t = text;
          setText("");
          start(() => createSpark(kind, t, Number(interestId) || null));
        }}
        className="flex flex-col gap-2"
      >
        <div className="flex gap-1.5">
          {KINDS.map((k) => (
            <button key={k.k} type="button" aria-pressed={kind === k.k} onClick={() => setKind(k.k)} className={`h-9 rounded-xl px-3 text-xs ${kind === k.k ? "bg-vermilion font-semibold text-obsidian" : "border border-white/15"}`}>{k.l}</button>
          ))}
          {!fixedInterestId && <label className="ml-auto">
            <span className="sr-only">Territorio</span>
            <select value={interestId} onChange={(e) => setInterestId(e.target.value)} className="h-9 rounded-xl border border-white/10 bg-[#1c1b1a] px-2 text-xs text-ink outline-none">
              <option value="">Sin territorio</option>
              {interests.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </label>}
        </div>
        <div className="flex gap-2">
          <label className="flex-1">
            <span className="sr-only">Chispa</span>
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder={kind === "idea" ? "Algo que te dio curiosidad…" : "Pega el enlace y, si quieres, una nota"} className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm outline-none placeholder:text-faint" />
          </label>
          <button type="submit" aria-label="Guardar chispa" className="flex h-11 w-11 items-center justify-center rounded-full bg-ink text-obsidian">
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </button>
        </div>
      </form>
      <div className="mt-3 flex flex-col">
        {items.map((s) => (
          <div key={s.id} className="group flex gap-3 border-t border-white/[0.07] py-3">
            <span className={`h-fit rounded-lg px-2 py-1 font-mono text-[9px] uppercase tracking-[0.1em] ${s.kind === "idea" ? "bg-vermilion text-obsidian" : "bg-white/[0.08]"}`}>{s.kind}</span>
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="break-words text-sm leading-snug">
                {s.url ? (
                  <>
                    {s.text.replace(s.url, "").trim()}{" "}
                    <a href={s.url} target="_blank" rel="noreferrer" className="break-all">{s.text.trim() === s.url ? s.url : "abrir ↗"}</a>
                  </>
                ) : (
                  s.text
                )}
              </span>
              <span className="text-xs text-muted">{[s.interest, `${s.createdAt.slice(8, 10)}/${s.createdAt.slice(5, 7)}`].filter(Boolean).join(" · ")}</span>
            </span>
            <button type="button" aria-label="Eliminar chispa" onClick={() => start(() => deleteSpark(s.id))} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100">×</button>
          </div>
        ))}
        {!items.length && <p className="m-0 py-3 text-sm text-faint">Sin chispas todavía. Guarda aquí lo que te despierte curiosidad, sin presión de procesarlo.</p>}
      </div>
    </div>
  );
}
