"use client";

import { useOptimistic, useTransition } from "react";
import { toggleHabit } from "@/actions/habits";

type Item = { id: number; name: string; timeHint: string; doneToday: boolean };

export function TodayChecklist({ items, date, compact = false }: { items: Item[]; date: string; compact?: boolean }) {
  const [, start] = useTransition();
  const [state, setOptimistic] = useOptimistic(items, (cur, { id, done }: { id: number; done: boolean }) =>
    cur.map((i) => (i.id === id ? { ...i, doneToday: done } : i)),
  );
  if (!items.length) return <p className="m-0 text-sm text-muted">Aún no tienes hábitos. Créalos en Habits.</p>;
  return (
    <div className="flex flex-col gap-1">
      {state.map((h) => (
        <button
          key={h.id}
          type="button"
          aria-pressed={h.doneToday}
          onClick={() =>
            start(async () => {
              setOptimistic({ id: h.id, done: !h.doneToday });
              await toggleHabit(h.id, date, !h.doneToday);
            })
          }
          className={`flex min-h-12 items-center gap-3.5 rounded-xl px-3 text-left text-[15px] transition-colors ${h.doneToday ? "bg-white/[0.05]" : "hover:bg-white/[0.03]"}`}
        >
          <span
            aria-hidden="true"
            className={`flex h-[22px] w-[22px] flex-none items-center justify-center rounded-[7px] border-[1.5px] text-[13px] font-bold text-obsidian ${h.doneToday ? "border-vermilion bg-vermilion" : "border-[#4A4844]"}`}
          >
            {h.doneToday ? "✓" : ""}
          </span>
          <span className={`flex-1 ${h.doneToday ? "text-muted line-through" : ""}`}>{h.name}</span>
          {!compact && h.timeHint && <span className="font-mono text-[11px] text-muted">{h.timeHint}</span>}
        </button>
      ))}
    </div>
  );
}
