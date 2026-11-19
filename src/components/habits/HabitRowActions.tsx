"use client";

import { useTransition } from "react";
import { archiveHabit } from "@/actions/habits";

export function ArchiveButton({ id, name }: { id: number; name: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      aria-label={`Archivar ${name}`}
      disabled={pending}
      onClick={() => {
        if (confirm(`¿Archivar "${name}"? Su historial se conserva.`)) start(() => archiveHabit(id));
      }}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-muted opacity-0 transition-opacity hover:text-ink focus:opacity-100 group-hover:opacity-100"
    >
      <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 7h16v13H4zM2 3h20v4H2zM10 12h4" /></svg>
    </button>
  );
}
