"use client";

import { useRef, useState, useTransition } from "react";
import { closeQuestion, createQuestion, deleteQuestion, reopenQuestion } from "@/actions/knowledge";

type Q = { id: number; text: string; status: "abierta" | "cerrada"; conclusion: string; interest: string | null; createdAt: string; closedAt: string | null };

export function Questions({ items, interests, fixedInterestId }: { items: Q[]; interests: { id: number; name: string }[]; fixedInterestId?: number }) {
  const formRef = useRef<HTMLFormElement>(null);
  const open = items.filter((q) => q.status === "abierta");
  const closed = items.filter((q) => q.status === "cerrada");
  return (
    <div className="flex flex-col">
      <ol className="m-0 flex list-none flex-col p-0">
        {open.map((q, i) => <OpenQ key={q.id} q={q} n={i + 1} />)}
      </ol>
      {!open.length && <p className="m-0 py-3 text-sm text-faint">Las preguntas grandes que te acompañan. Escribe la primera abajo.</p>}
      <form ref={formRef} action={async (fd) => { await createQuestion(fd); formRef.current?.reset(); }} className="mt-3 flex flex-wrap gap-2 border-t border-white/[0.07] pt-4">
        <label className="min-w-0 flex-[3_1_240px]">
          <span className="sr-only">Nueva pregunta</span>
          <input name="text" required placeholder="¿Qué quieres entender?" className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm outline-none placeholder:text-faint" />
        </label>
        {fixedInterestId ? (
          <input type="hidden" name="interestId" value={fixedInterestId} />
        ) : (
          <label className="flex-[1_1_150px]">
            <span className="sr-only">Territorio</span>
            <select name="interestId" className="h-11 w-full rounded-xl border border-white/10 bg-[#1c1b1a] px-3 text-sm text-ink outline-none">
              <option value="">Sin territorio</option>
              {interests.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </label>
        )}
        <button type="submit" className="h-11 rounded-xl bg-vermilion px-4 text-sm font-bold text-obsidian">Añadir</button>
      </form>
      {closed.length > 0 && (
        <details className="mt-5">
          <summary className="cursor-pointer text-sm text-muted">Respondidas ({closed.length})</summary>
          <ul className="m-0 mt-2 flex list-none flex-col gap-3 p-0">
            {closed.map((q) => <ClosedQ key={q.id} q={q} />)}
          </ul>
        </details>
      )}
    </div>
  );
}

function OpenQ({ q, n }: { q: Q; n: number }) {
  const [, start] = useTransition();
  const [closing, setClosing] = useState(false);
  const [c, setC] = useState("");
  return (
    <li className="group flex gap-[18px] border-t border-white/[0.07] py-4">
      <span className="pt-2 font-mono text-[11px] text-[#FF8A55]">{String(n).padStart(2, "0")}</span>
      <span className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="font-serif text-[25px] leading-[1.15]">{q.text}</span>
        <span className="text-xs text-muted">{[q.interest, `abierta desde ${q.createdAt.slice(8, 10)}/${q.createdAt.slice(5, 7)}`].filter(Boolean).join(" · ")}</span>
        {closing ? (
          <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); start(() => closeQuestion(q.id, c)); }}>
            <label className="flex-1">
              <span className="sr-only">Tu conclusión</span>
              <input autoFocus value={c} onChange={(e) => setC(e.target.value)} placeholder="Tu respuesta, en una línea" className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 font-serif text-base outline-none placeholder:text-faint" />
            </label>
            <button type="submit" className="h-10 rounded-xl bg-ink px-3.5 text-[13px] font-bold text-obsidian">Cerrar</button>
            <button type="button" onClick={() => setClosing(false)} className="h-10 rounded-xl px-3 text-[13px] text-muted">Cancelar</button>
          </form>
        ) : (
          <span className="flex gap-2 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
            <button type="button" onClick={() => setClosing(true)} className="h-8 rounded-lg border border-white/15 px-3 text-xs">Ya tengo una respuesta</button>
            <button type="button" onClick={() => confirm("¿Eliminar esta pregunta?") && start(() => deleteQuestion(q.id))} className="h-8 rounded-lg px-3 text-xs text-muted">Eliminar</button>
          </span>
        )}
      </span>
    </li>
  );
}

function ClosedQ({ q }: { q: Q }) {
  const [, start] = useTransition();
  return (
    <li className="rounded-2xl border border-white/[0.07] bg-white/[0.02] px-5 py-4">
      <span className="block font-serif text-lg text-muted line-through decoration-white/20">{q.text}</span>
      {q.conclusion && <span className="mt-1 block font-serif text-lg">→ {q.conclusion}</span>}
      <span className="mt-2 flex items-center gap-3 text-xs text-faint">
        cerrada el {q.closedAt?.slice(8)}/{q.closedAt?.slice(5, 7)}
        <button type="button" onClick={() => start(() => reopenQuestion(q.id))} className="h-8 rounded-lg px-2 text-muted hover:text-ink">Reabrir</button>
      </span>
    </li>
  );
}
