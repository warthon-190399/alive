"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { createGoal, deleteGoal, updateGoal } from "@/actions/strategy";

type Goal = {
  id: number;
  title: string;
  horizon: "trimestre" | "año" | "vision";
  pillarName: string | null;
  status: "activo" | "logrado" | "soltado";
  due: string | null;
  shownProgress: number;
  derived: boolean;
  projects: number;
};
const HORIZONS = [
  { k: "trimestre", l: "Este trimestre" },
  { k: "año", l: "Este año" },
  { k: "vision", l: "Visión" },
] as const;

export function Goals({ goals, pillars, year }: { goals: Goal[]; pillars: { id: number; name: string }[]; year: number }) {
  const formRef = useRef<HTMLFormElement>(null);
  const sub: Record<string, string> = { trimestre: `Q${Math.floor(new Date().getMonth() / 3) + 1} ${new Date().getFullYear()}`, año: String(new Date().getFullYear()), vision: String(year) };
  return (
    <>
      <form
        ref={formRef}
        action={async (fd) => {
          await createGoal(fd);
          formRef.current?.reset();
        }}
        className="glass mb-4 flex flex-wrap gap-2 rounded-[18px] p-3"
      >
        <label className="min-w-56 flex-[3_1_260px]">
          <span className="sr-only">Nuevo objetivo</span>
          <input name="title" required placeholder="Nuevo objetivo: ¿qué quieres lograr?" className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm outline-none placeholder:text-faint" />
        </label>
        <label className="flex-[1_1_150px]">
          <span className="sr-only">Pilar</span>
          <select name="pillarId" className="h-11 w-full rounded-xl border border-white/10 bg-[#1c1b1a] px-3 text-sm text-ink outline-none">
            <option value="">Sin pilar</option>
            {pillars.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
        <label className="flex-[1_1_140px]">
          <span className="sr-only">Horizonte</span>
          <select name="horizon" className="h-11 w-full rounded-xl border border-white/10 bg-[#1c1b1a] px-3 text-sm text-ink outline-none">
            {HORIZONS.map((h) => <option key={h.k} value={h.k}>{h.l}</option>)}
          </select>
        </label>
        <label className="flex-[1_1_140px]">
          <span className="sr-only">Fecha límite</span>
          <input name="due" type="date" className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-ink outline-none [color-scheme:dark]" />
        </label>
        <button type="submit" className="h-11 rounded-xl bg-vermilion px-5 text-sm font-bold text-obsidian">Añadir</button>
      </form>
      <div className="flex flex-wrap gap-3.5">
        {HORIZONS.map((h) => {
          const list = goals.filter((g) => g.horizon === h.k);
          return (
            <div key={h.k} className={`flex min-w-0 flex-[1_1_300px] flex-col gap-2.5 rounded-[18px] border border-white/[0.08] p-4 ${h.k === "trimestre" ? "bg-white/[0.04]" : "bg-white/[0.025]"}`}>
              <div className="flex items-baseline justify-between px-0.5 pb-1.5">
                <span className="text-xl font-bold tracking-[-0.03em]">{h.l}</span>
                <span className="font-mono text-[11px] text-faint">{sub[h.k]}</span>
              </div>
              {list.map((g) => <GoalCard key={g.id} g={g} />)}
              {!list.length && <p className="m-0 px-1 py-3 text-[13px] text-faint">Sin objetivos todavía.</p>}
            </div>
          );
        })}
      </div>
    </>
  );
}

function GoalCard({ g }: { g: Goal }) {
  const [, start] = useTransition();
  const [progress, setProgress] = useState(g.shownProgress);
  const done = g.status === "logrado";
  return (
    <div className="group flex flex-col gap-2.5 rounded-[14px] border border-white/[0.08] bg-obsidian/80 px-4 py-3.5">
      <div className="flex items-start gap-2">
        <span className={`flex-1 text-[15px] leading-snug ${done ? "text-muted line-through" : ""}`}>{g.title}</span>
        <span className="flex opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
          <button type="button" aria-label={done ? "Reabrir objetivo" : "Marcar como logrado"} onClick={() => start(() => updateGoal(g.id, { status: done ? "activo" : "logrado" }))} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:text-ink">
            <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12l5 5L20 7" /></svg>
          </button>
          <button type="button" aria-label="Soltar objetivo" title="Soltar: ya no lo persigo" onClick={() => confirm("¿Soltar este objetivo? Dejará de mostrarse.") && start(() => updateGoal(g.id, { status: "soltado" }))} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:text-ink">
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
          {g.projects === 0 && (
            <button type="button" aria-label="Eliminar objetivo" onClick={() => confirm("¿Eliminar este objetivo?") && start(() => deleteGoal(g.id))} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:text-ink">
              <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></svg>
            </button>
          )}
        </span>
      </div>
      <span className="flex items-center gap-2.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#FFB08A]">{g.pillarName ?? "Sin pilar"}</span>
        <span className="h-[3px] flex-1 overflow-hidden rounded bg-white/[0.08]">
          <span className="block h-full bg-vermilion" style={{ width: `${progress}%` }} />
        </span>
        <span className="font-mono text-[11px] text-muted">{progress}%</span>
      </span>
      {!g.derived && !done && (
        <label className="flex items-center gap-2 text-[11px] text-faint">
          <span className="sr-only">Progreso manual</span>
          <input type="range" min={0} max={100} step={5} value={progress} onChange={(e) => setProgress(Number(e.target.value))} onPointerUp={() => start(() => updateGoal(g.id, { progress }))} onKeyUp={() => start(() => updateGoal(g.id, { progress }))} className="flex-1 accent-[#FF572E]" />
        </label>
      )}
      {(g.derived || g.due) && (
        <span className="text-[11px] text-faint">
          {g.derived && (
            <Link href="/projects" className="text-faint">
              {g.projects} proyecto{g.projects > 1 ? "s" : ""}
            </Link>
          )}
          {g.derived && g.due ? " · " : ""}
          {g.due ? `vence ${g.due.slice(8)}/${g.due.slice(5, 7)}/${g.due.slice(0, 4)}` : ""}
        </span>
      )}
    </div>
  );
}
