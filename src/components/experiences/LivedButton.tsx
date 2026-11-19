"use client";

import { useTransition } from "react";
import { markLived } from "@/actions/experiences";

export function LivedButton({ id }: { id: number }) {
  const [pending, start] = useTransition();
  return (
    <button type="button" disabled={pending} onClick={() => start(() => markLived(id))} className="h-9 w-fit rounded-full bg-obsidian/80 px-3.5 text-xs font-semibold text-ink">
      Lo viví ✓
    </button>
  );
}
