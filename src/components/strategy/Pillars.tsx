"use client";

import { useState, useTransition } from "react";
import { archivePillar, createPillar, seedPillars, setPillarScore, updatePillar } from "@/actions/strategy";

type Pillar = { id: number; name: string; why: string; score: number | null; delta: number | null; goals: number };

export function Pillars({ items, month, monthLabel }: { items: Pillar[]; month: string; monthLabel: string }) {
  const [pending, start] = useTransition();
  if (!items.length)
    return (
      <div className="glass flex flex-wrap items-center justify-between gap-4 rounded-[20px] p-7">
        <p className="m-0 max-w-xl text-[15px] leading-relaxed text-muted">
          Los pilares son las áreas de tu vida que quieres cuidar. Cada objetivo vive en uno, y cada mes puedes puntuar cómo te sientes en cada área.
        </p>
        <button type="button" disabled={pending} onClick={() => start(() => seedPillars())} className="h-11 rounded-full bg-vermilion px-5 text-sm font-bold text-obsidian">
          Crear 6 pilares sugeridos
        </button>
      </div>
    );
  return (
    <div className="flex flex-wrap gap-3.5">
      {items.map((p) => (
        <PillarCard key={p.id} p={p} month={month} monthLabel={monthLabel} />
      ))}
      <form action={createPillar} className="flex min-w-0 max-w-[280px] flex-[1_1_200px] flex-col justify-center gap-2 rounded-[18px] border border-dashed border-white/15 p-5">
        <label>
          <span className="sr-only">Nombre del pilar</span>
          <input name="name" required placeholder="Nuevo pilar" className="h-10 w-full border-0 bg-transparent text-lg font-bold tracking-[-0.03em] outline-none placeholder:text-faint" />
        </label>
        <label>
          <span className="sr-only">Por qué importa</span>
          <input name="why" placeholder="Por qué importa" className="h-9 w-full border-0 bg-transparent text-[13px] text-muted outline-none placeholder:text-faint" />
        </label>
        <button type="submit" className="mt-1 h-10 w-fit rounded-full bg-white/10 px-4 text-[13px] font-semibold">Añadir pilar</button>
      </form>
    </div>
  );
}

function PillarCard({ p, month, monthLabel }: { p: Pillar; month: string; monthLabel: string }) {
  const [score, setScore] = useState(p.score ?? 50);
  const [touched, setTouched] = useState(p.score != null);
  const [, start] = useTransition();
  const c = 2 * Math.PI * 16;
  const shown = touched ? score : 0;
  const commit = () => {
    setTouched(true);
    start(() => setPillarScore(p.id, month, score));
  };
  return (
    <div className="glass group flex min-w-0 flex-[1_1_200px] flex-col gap-3 rounded-[18px] p-5">
      <div className="flex items-center justify-between">
        <span className="eyebrow text-faint">{p.goals} objetivo{p.goals === 1 ? "" : "s"}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label={`Archivar ${p.name}`}
            onClick={() => confirm(`¿Archivar el pilar "${p.name}"?`) && start(() => archivePillar(p.id))}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100"
          >
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 7h16v13H4zM2 3h20v4H2zM10 12h4" /></svg>
          </button>
          <svg role="img" aria-label={touched ? `${score} de 100` : "Sin puntaje"} width="40" height="40" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
            <circle cx="20" cy="20" r="16" fill="none" stroke={shown >= 75 ? "#FF572E" : "#F4EADB"} strokeWidth="3" strokeLinecap="round" strokeDasharray={`${(c * shown) / 100} ${c}`} transform="rotate(-90 20 20)" />
          </svg>
        </div>
      </div>
      <label>
        <span className="sr-only">Nombre</span>
        <input
          defaultValue={p.name}
          onBlur={(e) => e.target.value !== p.name && start(() => updatePillar(p.id, { name: e.target.value }))}
          className="w-full border-0 bg-transparent p-0 text-xl font-bold tracking-[-0.03em] outline-none"
        />
      </label>
      <label>
        <span className="sr-only">Por qué importa</span>
        <textarea
          defaultValue={p.why}
          rows={2}
          onBlur={(e) => e.target.value !== p.why && start(() => updatePillar(p.id, { why: e.target.value }))}
          placeholder="Por qué importa"
          className="block w-full resize-none overflow-hidden border-0 bg-transparent p-0 text-[13px] leading-relaxed text-muted outline-none placeholder:text-faint"
        />
      </label>
      <label className="mt-auto flex flex-col gap-1.5 border-t border-white/[0.07] pt-3">
        <span className="flex justify-between text-xs text-muted">
          <span>¿Cómo vas en {monthLabel}?</span>
          <span className="font-mono text-ink">
            {touched ? score : "—"}
            {p.delta != null && <span className={p.delta >= 0 ? "text-[#FF8A55]" : "text-muted"}> {p.delta >= 0 ? `+${p.delta}` : p.delta}</span>}
          </span>
        </span>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={score}
          onChange={(e) => {
            setScore(Number(e.target.value));
            setTouched(true);
          }}
          onPointerUp={commit}
          onKeyUp={commit}
          className="w-full accent-[#FF572E]"
        />
      </label>
    </div>
  );
}
