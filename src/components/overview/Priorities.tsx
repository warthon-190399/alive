"use client";

import { useOptimistic, useRef, useTransition } from "react";
import { addPriority, deletePriority, setPriorityDone } from "@/actions/overview";

type P = { id: number; title: string; area: string; done: boolean };
const DEFAULT_AREAS = ["Carrera", "Creatividad", "Relaciones", "Salud", "Finanzas", "Mente"];

export function Priorities({ items, areas }: { items: P[]; areas?: string[] }) {
  const AREAS = areas?.length ? areas : DEFAULT_AREAS;
  const [, start] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, apply] = useOptimistic(items, (cur, a: { id: number; done?: boolean; remove?: boolean }) =>
    a.remove ? cur.filter((p) => p.id !== a.id) : cur.map((p) => (p.id === a.id ? { ...p, done: !!a.done } : p)),
  );
  const done = state.filter((p) => p.done).length;
  return (
    <div className="flex flex-col">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="eyebrow text-faint">Prioridades de hoy</span>
        <span className="text-[13px] text-muted">{state.length ? `${done} de ${state.length} hecho` : "Elige hasta tres"}</span>
      </div>
      {state.map((p, i) => (
        <div key={p.id} className="group flex items-center gap-5 border-t border-white/[0.07] py-3.5">
          <button
            type="button"
            aria-pressed={p.done}
            aria-label={p.done ? `Marcar "${p.title}" como pendiente` : `Marcar "${p.title}" como hecha`}
            onClick={() => start(async () => { apply({ id: p.id, done: !p.done }); await setPriorityDone(p.id, !p.done); })}
            className={`w-9 font-display text-[44px] leading-none ${p.done ? "text-[#5A5852]" : i === state.findIndex((x) => !x.done) ? "text-vermilion" : "text-ink"}`}
          >
            {i + 1}
          </button>
          <span className={`min-w-0 flex-1 text-lg ${p.done ? "text-faint line-through" : ""}`}>{p.title}</span>
          {p.area && <span className="rounded-xl border border-white/15 px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-[#C9C5BC]">{p.area}</span>}
          <button
            type="button"
            aria-label={`Eliminar "${p.title}"`}
            onClick={() => start(async () => { apply({ id: p.id, remove: true }); await deletePriority(p.id); })}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100"
          >
            <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
      ))}
      {state.length < 5 && (
        <form ref={formRef} action={async (fd) => { await addPriority(fd); formRef.current?.reset(); }} className="flex gap-2 border-t border-white/[0.07] pt-3.5">
          <label className="min-w-0 flex-1">
            <span className="sr-only">Nueva prioridad</span>
            <input name="title" required placeholder="¿Qué importa hoy?" className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm outline-none placeholder:text-faint" />
          </label>
          <label>
            <span className="sr-only">Área</span>
            <select name="area" className="h-11 rounded-xl border border-white/10 bg-[#1c1b1a] px-3 text-sm text-ink outline-none">
              {AREAS.map((a) => <option key={a}>{a}</option>)}
            </select>
          </label>
          <button type="submit" className="h-11 rounded-xl bg-ink px-4 text-sm font-bold text-obsidian">Añadir</button>
        </form>
      )}
    </div>
  );
}
