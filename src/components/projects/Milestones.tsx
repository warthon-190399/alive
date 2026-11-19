"use client";

import { useOptimistic, useRef, useTransition } from "react";
import { createMilestone, deleteMilestone, toggleMilestone } from "@/actions/projects";

type M = { id: number; title: string; due: string | null; done: boolean };

export function Milestones({ projectId, items }: { projectId: number; items: M[] }) {
  const [, start] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, apply] = useOptimistic(items, (cur, a: { id: number; done?: boolean; del?: boolean }) =>
    a.del ? cur.filter((m) => m.id !== a.id) : cur.map((m) => (m.id === a.id ? { ...m, done: !!a.done } : m)),
  );
  return (
    <div className="flex flex-col">
      {state.map((m, i) => (
        <div key={m.id} className="group flex items-center gap-3.5 py-2.5">
          <span className="flex flex-col items-center self-stretch">
            <button
              type="button"
              aria-pressed={m.done}
              aria-label={m.done ? `Reabrir hito ${m.title}` : `Marcar hito ${m.title} como hecho`}
              onClick={() => start(async () => { apply({ id: m.id, done: !m.done }); await toggleMilestone(m.id, !m.done); })}
              className="flex h-6 w-6 flex-none items-center justify-center rounded-full border-2"
              style={{ background: m.done ? "#FF572E" : "#141414", borderColor: m.done ? "#FF572E" : "#4A4844" }}
            >
              {m.done && <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#141414" strokeWidth="3"><path d="M5 12l5 5L20 7" /></svg>}
            </button>
            {i < state.length - 1 && <span aria-hidden="true" className="mt-1 w-0.5 flex-1" style={{ background: m.done ? "#FF572E" : "#2A2926", minHeight: 18 }} />}
          </span>
          <span className={`flex-1 text-[15px] ${m.done ? "text-muted line-through" : ""}`}>{m.title}</span>
          <span className="font-mono text-[11px] text-faint">{m.due ? `${m.due.slice(8)}/${m.due.slice(5, 7)}` : ""}</span>
          <button type="button" aria-label={`Eliminar hito ${m.title}`} onClick={() => start(async () => { apply({ id: m.id, del: true }); await deleteMilestone(m.id); })} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100">
            <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
      ))}
      {!state.length && <p className="m-0 py-2 text-sm text-faint">Los hitos marcan los momentos importantes del proyecto.</p>}
      <form ref={formRef} action={async (fd) => { await createMilestone(fd); formRef.current?.reset(); }} className="mt-3 flex flex-wrap gap-2 border-t border-white/[0.07] pt-3">
        <input type="hidden" name="projectId" value={projectId} />
        <label className="min-w-0 flex-[2_1_160px]">
          <span className="sr-only">Nuevo hito</span>
          <input name="title" required placeholder="Nuevo hito" className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm outline-none placeholder:text-faint" />
        </label>
        <label className="flex-[1_1_130px]">
          <span className="sr-only">Fecha del hito</span>
          <input name="due" type="date" className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-ink outline-none [color-scheme:dark]" />
        </label>
        <button type="submit" className="h-10 rounded-xl bg-white/10 px-4 text-sm font-semibold">Añadir</button>
      </form>
    </div>
  );
}
