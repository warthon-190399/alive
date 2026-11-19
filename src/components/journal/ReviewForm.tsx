"use client";

import { useEffect, useRef, useState } from "react";
import { saveReview } from "@/actions/journal";

export const REVIEW_QUESTIONS = [
  { k: "energia", q: "¿Qué me dio energía y qué me la quitó?" },
  { k: "vision", q: "¿Mis días se parecieron a mi visión?" },
  { k: "soltar", q: "¿Qué dejo ir el próximo mes?" },
  { k: "palabras", q: "Este mes en tres palabras" },
];

export function ReviewForm({ period, initial }: { period: string; initial: Record<string, string> }) {
  const [answers, setAnswers] = useState(initial);
  const [status, setStatus] = useState("");
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setStatus("Guardando…");
    const t = setTimeout(async () => {
      await saveReview(period, answers);
      setStatus("Guardado");
    }, 800);
    return () => clearTimeout(t);
  }, [answers, period]);

  return (
    <div className="flex flex-col">
      {REVIEW_QUESTIONS.map((q, i) => (
        <label key={q.k} className="flex gap-4 border-t border-black/20 py-3.5">
          <span className="pt-1.5 font-mono text-xs">0{i + 1}</span>
          <span className="flex flex-1 flex-col gap-1.5">
            <span className="font-display text-2xl leading-tight">{q.q}</span>
            <textarea
              value={answers[q.k] ?? ""}
              onChange={(e) => setAnswers((a) => ({ ...a, [q.k]: e.target.value }))}
              rows={1}
              placeholder="Escribe tu respuesta…"
              className="min-h-8 w-full resize-none overflow-hidden border-0 bg-transparent p-0 font-serif text-lg leading-relaxed text-[#140E0A] outline-none placeholder:text-black/40"
            />
          </span>
        </label>
      ))}
      <span aria-live="polite" className="mt-2 font-mono text-[11px]">{status}</span>
    </div>
  );
}
