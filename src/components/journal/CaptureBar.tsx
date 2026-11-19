"use client";

import { useState, useTransition } from "react";
import { addFragment } from "@/actions/journal";

const KINDS = [
  { k: "nota", l: "Nota" },
  { k: "gratitud", l: "Gratitud" },
  { k: "recuerdo", l: "Recuerdo" },
  { k: "web", l: "Imagen web" },
] as const;

export function CaptureBar({ date }: { date: string }) {
  const [kind, setKind] = useState<(typeof KINDS)[number]["k"]>("nota");
  const [text, setText] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = () =>
    start(async () => {
      const r = await addFragment(date, kind, text);
      if (r.ok) {
        setText("");
        setMsg(null);
      } else setMsg(r.error);
    });

  return (
    <div className="sticky bottom-6 z-20 mt-8">
      <form
        role="group"
        aria-label="Captura rápida"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex flex-wrap items-center gap-3 rounded-[26px] border border-[rgba(255,214,180,0.14)] bg-[rgba(40,26,18,0.6)] py-2.5 pl-3.5 pr-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.45)] backdrop-blur-2xl"
      >
        <div className="flex flex-wrap gap-1.5">
          {KINDS.map((x) => (
            <button
              key={x.k}
              type="button"
              aria-pressed={kind === x.k}
              onClick={() => setKind(x.k)}
              className={`h-11 rounded-2xl px-3.5 text-xs ${kind === x.k ? "bg-vermilion/90 font-semibold text-[#140E0A]" : "border border-[rgba(255,214,180,0.14)] text-[#E4D6C3]"}`}
            >
              {x.l}
            </button>
          ))}
        </div>
        <label className="flex min-w-40 flex-1">
          <span className="sr-only">Escribe un fragmento</span>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={kind === "web" ? "Pega el enlace de una imagen…" : "Escribe un pensamiento…"}
            className="h-11 w-full border-0 bg-transparent text-[15px] text-cream outline-none placeholder:text-umber"
          />
        </label>
        <button type="submit" disabled={pending} aria-label="Guardar fragmento" className="flex h-11 w-11 items-center justify-center rounded-full bg-cream text-[#140E0A] disabled:opacity-50">
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </button>
      </form>
      {msg && <p role="alert" className="mx-4 mt-2 text-sm text-[#FFB08A]">{msg}</p>}
    </div>
  );
}
