"use client";

import { useState, useTransition } from "react";
import { geocode } from "@/actions/experiences";

type Loc = { place: string; lat: number | null; lng: number | null };

/** Escribe un lugar, búscalo en el mapa y elige el resultado. */
export function LocationSearch({ value, onChange }: { value: Loc; onChange: (v: Loc) => void }) {
  const [q, setQ] = useState(value.place);
  const [results, setResults] = useState<{ label: string; short: string; lat: number; lng: number }[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const search = () =>
    start(async () => {
      setErr(null);
      try {
        const r = await geocode(q);
        if (!r.ok) return setErr(r.error);
        setResults(r.results);
        if (!r.results.length) setErr("Sin resultados. Prueba con ciudad y país.");
      } catch {
        setErr("No se pudo buscar el lugar. ¿Hay conexión a internet?");
      }
    });
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <label className="flex-1">
          <span className="sr-only">Lugar</span>
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              onChange({ place: e.target.value, lat: value.lat, lng: value.lng });
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                search();
              }
            }}
            placeholder="Lugar: Barranco, Lima · Huaraz · Café Bisetti…"
            className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm outline-none placeholder:text-faint"
          />
        </label>
        <button type="button" onClick={search} disabled={pending || !q.trim()} className="h-10 rounded-xl border border-white/15 px-3.5 text-[13px] font-semibold disabled:opacity-40">
          {pending ? "Buscando…" : "Ubicar en el mapa"}
        </button>
      </div>
      {value.lat != null && value.lng != null && (
        <span className="flex items-center gap-2 text-xs text-[#FF8A55]">
          ● Ubicado ({value.lat.toFixed(3)}, {value.lng.toFixed(3)})
          <button type="button" onClick={() => onChange({ place: value.place, lat: null, lng: null })} className="h-7 rounded-lg px-2 text-muted hover:text-ink">quitar del mapa</button>
        </span>
      )}
      {results.length > 0 && (
        <ul className="m-0 flex list-none flex-col gap-1 rounded-xl border border-white/10 bg-[#1c1a19] p-1.5">
          {results.map((r) => (
            <li key={`${r.lat},${r.lng}`}>
              <button
                type="button"
                onClick={() => {
                  onChange({ place: value.place || r.short, lat: r.lat, lng: r.lng });
                  if (!q.trim()) setQ(r.short);
                  setResults([]);
                }}
                className="w-full rounded-lg px-3 py-2 text-left text-[13px] hover:bg-white/[0.06]"
              >
                <span className="block">{r.short}</span>
                <span className="block truncate text-[11px] text-muted">{r.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {err && <p role="alert" className="m-0 text-xs text-[#FFB08A]">{err}</p>}
    </div>
  );
}
