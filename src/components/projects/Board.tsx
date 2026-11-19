"use client";

import { useOptimistic, useState, useTransition } from "react";
import { createTask, deleteTask, moveTask } from "@/actions/projects";

type Status = "ideas" | "en_curso" | "revision" | "hecho";
type Task = { id: number; title: string; status: Status };
const COLS: { k: Status; l: string; dot: string }[] = [
  { k: "ideas", l: "Ideas", dot: "#5A5852" },
  { k: "en_curso", l: "En curso", dot: "#FF572E" },
  { k: "revision", l: "En revisión", dot: "#F4EADB" },
  { k: "hecho", l: "Hecho", dot: "#3A3935" },
];

type Act = { type: "move"; id: number; status: Status } | { type: "add"; task: Task } | { type: "del"; id: number };

export function Board({ projectId, tasks }: { projectId: number; tasks: Task[] }) {
  const [, start] = useTransition();
  const [state, apply] = useOptimistic(tasks, (cur, a: Act) =>
    a.type === "move" ? cur.map((t) => (t.id === a.id ? { ...t, status: a.status } : t)) : a.type === "add" ? [...cur, a.task] : cur.filter((t) => t.id !== a.id),
  );
  const [over, setOver] = useState<Status | null>(null);
  const move = (id: number, status: Status) =>
    start(async () => {
      apply({ type: "move", id, status });
      await moveTask(id, status);
    });

  return (
    <div className="grid grid-cols-[repeat(4,minmax(240px,1fr))] gap-3.5 overflow-x-auto pb-1">
      {COLS.map((c, ci) => {
        const list = state.filter((t) => t.status === c.k);
        return (
          <div
            key={c.k}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(c.k);
            }}
            onDragLeave={() => setOver(null)}
            onDrop={(e) => {
              e.preventDefault();
              setOver(null);
              const id = Number(e.dataTransfer.getData("text/plain"));
              if (id) move(id, c.k);
            }}
            className={`flex min-h-56 flex-col gap-2.5 rounded-[18px] border p-3.5 transition-colors ${over === c.k ? "border-vermilion/60 bg-vermilion/[0.06]" : "border-white/[0.06] bg-white/[0.025]"}`}
          >
            <div className="flex items-center gap-2 px-1 pb-1.5 pt-1">
              <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: c.dot }} />
              <span className="text-[13px] font-semibold">{c.l}</span>
              <span className="ml-auto font-mono text-[11px] text-faint">{list.length}</span>
            </div>
            {list.map((t) => (
              <div
                key={t.id}
                draggable
                onDragStart={(e) => e.dataTransfer.setData("text/plain", String(t.id))}
                className="group relative cursor-grab rounded-xl border border-white/[0.08] bg-white/[0.05] p-3.5 active:cursor-grabbing"
              >
                <span className={`block text-sm leading-snug ${c.k === "hecho" ? "text-faint line-through" : ""}`}>{t.title}</span>
                <span className="absolute right-1.5 top-1.5 flex gap-0.5 rounded-lg bg-[#262422] opacity-0 shadow-lg transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                  {ci > 0 && <Mini label={`Mover a ${COLS[ci - 1].l}`} onClick={() => move(t.id, COLS[ci - 1].k)} d="M15 18l-6-6 6-6" />}
                  {ci < COLS.length - 1 && <Mini label={`Mover a ${COLS[ci + 1].l}`} onClick={() => move(t.id, COLS[ci + 1].k)} d="M9 18l6-6-6-6" />}
                  <Mini
                    label="Eliminar tarea"
                    onClick={() =>
                      start(async () => {
                        apply({ type: "del", id: t.id });
                        await deleteTask(t.id);
                      })
                    }
                    d="M6 6l12 12M18 6L6 18"
                  />
                </span>
              </div>
            ))}
            <AddTask
              onAdd={(title) =>
                start(async () => {
                  apply({ type: "add", task: { id: -Date.now(), title, status: c.k } });
                  await createTask(projectId, title, c.k);
                })
              }
            />
          </div>
        );
      })}
    </div>
  );
}

function AddTask({ onAdd }: { onAdd: (t: string) => void }) {
  const [v, setV] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (v.trim()) onAdd(v.trim());
        setV("");
      }}
    >
      <label>
        <span className="sr-only">Nueva tarea</span>
        <input value={v} onChange={(e) => setV(e.target.value)} placeholder="+ Añadir tarea" className="h-10 w-full rounded-xl border border-dashed border-white/10 bg-transparent px-3 text-[13px] text-ink outline-none placeholder:text-faint focus:border-white/25" />
      </label>
    </form>
  );
}

function Mini({ label, onClick, d }: { label: string; onClick: () => void; d: string }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-white/10 hover:text-ink">
      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={d} /></svg>
    </button>
  );
}
