"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { deleteProject, setProjectCover, updateProject } from "@/actions/projects";

type Props = {
  p: { id: number; name: string; description: string; goalId: number | null; status: "idea" | "activo" | "pausado" | "hecho"; start: string | null; due: string | null; focus: boolean; cover?: string; progress: number; pillarName: string | null };
  goals: { id: number; title: string }[];
};

const STATUSES = [
  { k: "idea", l: "Idea" },
  { k: "activo", l: "Activo" },
  { k: "pausado", l: "Pausado" },
  { k: "hecho", l: "Hecho" },
] as const;

export function ProjectHeader({ p, goals }: Props) {
  const [, start] = useTransition();
  const [cover, setCover] = useState(p.cover);
  const [desc, setDesc] = useState(p.description);
  const [saved, setSaved] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setSaved("Guardando…");
    const t = setTimeout(async () => {
      await updateProject(p.id, { description: desc });
      setSaved("Guardado");
    }, 800);
    return () => clearTimeout(t);
  }, [desc, p.id]);

  const field = "h-11 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-ink outline-none [color-scheme:dark]";

  return (
    <section className="glass mt-4 flex flex-wrap overflow-hidden rounded-[22px]">
      <div className="relative min-h-56 min-w-0 flex-[2_1_280px]">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div aria-hidden="true" className="absolute inset-0" style={{ background: "radial-gradient(circle at 40% 40%, rgba(255,87,46,0.6), rgba(169,47,39,0.35) 45%, rgba(20,20,20,0.9) 80%)" }} />
        )}
        <button type="button" onClick={() => fileRef.current?.click()} className="absolute bottom-4 left-4 h-10 rounded-full bg-black/60 px-4 text-xs font-semibold text-ink backdrop-blur">
          Cambiar portada
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            const fd = new FormData();
            fd.set("projectId", String(p.id));
            fd.set("file", f);
            start(async () => {
              const r = await setProjectCover(fd);
              if (r.ok) setCover(r.url);
              else alert(r.error);
            });
          }}
        />
      </div>
      <div className="flex min-w-0 flex-[3_1_460px] flex-col gap-4 px-8 py-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <span className="eyebrow text-[#FF8A55]">{p.pillarName ?? "Sin pilar"}</span>
            <label>
              <span className="sr-only">Nombre del proyecto</span>
              <input
                defaultValue={p.name}
                onBlur={(e) => e.target.value !== p.name && start(() => updateProject(p.id, { name: e.target.value }))}
                className="w-full border-0 bg-transparent p-0 font-display text-[40px] leading-none outline-none"
              />
            </label>
          </div>
          <span className="flex flex-col items-end">
            <span className="font-display text-[56px] leading-none">{p.progress}%</span>
            <span className="text-xs text-muted">según tareas e hitos</span>
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="flex-[2_1_220px]">
            <span className="sr-only">Objetivo</span>
            <select defaultValue={p.goalId ?? ""} onChange={(e) => start(() => updateProject(p.id, { goalId: Number(e.target.value) || null }))} className={`${field} w-full bg-[#1c1b1a]`}>
              <option value="">Sin objetivo</option>
              {goals.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
            </select>
          </label>
          <label className="flex-[1_1_120px]">
            <span className="sr-only">Estado</span>
            <select defaultValue={p.status} onChange={(e) => start(() => updateProject(p.id, { status: e.target.value as Props["p"]["status"] }))} className={`${field} w-full bg-[#1c1b1a]`}>
              {STATUSES.map((s) => <option key={s.k} value={s.k}>{s.l}</option>)}
            </select>
          </label>
          <label className={`${field} flex flex-[1_1_150px] items-center gap-2 text-xs text-muted`}>
            Inicio
            <input type="date" defaultValue={p.start ?? ""} onChange={(e) => start(() => updateProject(p.id, { start: e.target.value || null }))} className="min-w-0 flex-1 border-0 bg-transparent text-sm text-ink outline-none" />
          </label>
          <label className={`${field} flex flex-[1_1_150px] items-center gap-2 text-xs text-muted`}>
            Entrega
            <input type="date" defaultValue={p.due ?? ""} onChange={(e) => start(() => updateProject(p.id, { due: e.target.value || null }))} className="min-w-0 flex-1 border-0 bg-transparent text-sm text-ink outline-none" />
          </label>
          <button type="button" aria-pressed={p.focus} onClick={() => start(() => updateProject(p.id, { focus: !p.focus }))} className={`h-11 rounded-xl px-4 text-sm font-semibold ${p.focus ? "bg-vermilion text-obsidian" : "border border-white/15"}`}>
            {p.focus ? "En foco" : "Poner en foco"}
          </button>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="flex justify-between text-xs text-muted"><span>De qué se trata</span><span aria-live="polite">{saved}</span></span>
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} placeholder="¿Qué es este proyecto y por qué importa?" className="block w-full resize-none overflow-hidden border-0 bg-transparent p-0 text-[15px] leading-relaxed text-[#E2DED6] outline-none placeholder:text-faint" />
        </label>
        <div className="flex items-center justify-between border-t border-white/[0.07] pt-3 text-xs">
          <Link href="/projects">← Todos los proyectos</Link>
          <button type="button" onClick={() => confirm(`¿Eliminar "${p.name}" con todas sus tareas e hitos?`) && start(() => deleteProject(p.id))} className="h-9 rounded-lg px-3 text-muted hover:text-[#FFB08A]">
            Eliminar proyecto
          </button>
        </div>
      </div>
    </section>
  );
}
