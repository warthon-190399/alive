"use client";

import { useEffect, useRef, useState } from "react";
import { saveVision } from "@/actions/strategy";

export function VisionCard({ initial, cover }: { initial: { statement: string; year: number; values: string[] }; cover?: string }) {
  const [statement, setStatement] = useState(initial.statement);
  const [year, setYear] = useState(initial.year);
  const [values, setValues] = useState(initial.values);
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState("");
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setStatus("Guardando…");
    const t = setTimeout(async () => {
      await saveVision({ statement, year, values });
      setStatus("Guardado");
    }, 800);
    return () => clearTimeout(t);
  }, [statement, year, values]);

  const addValue = () => {
    const v = draft.trim();
    if (v && !values.includes(v)) setValues([...values, v]);
    setDraft("");
  };

  return (
    <section aria-label="Visión" className="glass mt-7 flex flex-wrap overflow-hidden rounded-[22px]">
      <div className="flex min-w-0 flex-[3_1_420px] flex-col justify-center gap-4 px-8 py-9 md:px-11 md:py-10">
        <div className="flex items-center gap-2">
          <span className="eyebrow text-[#FF8A55]">Visión</span>
          <label className="flex items-center">
            <span className="sr-only">Año de la visión</span>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="eyebrow w-16 border-0 bg-transparent p-0 text-[#FF8A55] outline-none"
            />
          </label>
          <span aria-live="polite" className="ml-auto text-xs text-faint">{status}</span>
        </div>
        <label>
          <span className="sr-only">Declaración de visión</span>
          <textarea
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
            rows={2}
            placeholder="¿Cómo quieres que sea tu vida dentro de unos años? Escríbelo en una o dos frases."
            className="block w-full resize-none overflow-hidden border-0 bg-transparent p-0 font-serif text-[30px] leading-[1.2] text-ink outline-none placeholder:text-faint md:text-[36px]"
          />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          {values.map((v) => (
            <span key={v} className="flex items-center gap-1 rounded-full bg-[#24201C] py-1.5 pl-3 pr-1.5 text-xs text-[#FFB08A]">
              {v}
              <button type="button" aria-label={`Quitar ${v}`} onClick={() => setValues(values.filter((x) => x !== v))} className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-white/10">
                ×
              </button>
            </span>
          ))}
          <label>
            <span className="sr-only">Nuevo valor</span>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addValue();
                }
              }}
              onBlur={addValue}
              placeholder="+ valor"
              className="h-8 w-28 rounded-full border border-dashed border-white/15 bg-transparent px-3 text-xs text-ink outline-none placeholder:text-faint"
            />
          </label>
        </div>
      </div>
      <div className="relative min-h-60 min-w-0 flex-[2_1_300px] overflow-hidden">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{ background: "radial-gradient(circle at 60% 40%, rgba(255,87,46,0.55), rgba(169,47,39,0.35) 40%, rgba(20,20,20,0) 75%)" }}
          />
        )}
      </div>
    </section>
  );
}
