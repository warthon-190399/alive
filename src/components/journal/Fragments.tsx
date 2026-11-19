"use client";

import { useTransition } from "react";
import { deleteFragment } from "@/actions/journal";

type Frag = { id: number; kind: "nota" | "gratitud" | "recuerdo" | "web"; text: string; url: string | null; imageUrl?: string; createdAt: string };

const LABEL: Record<Frag["kind"], string> = { nota: "Nota rápida", gratitud: "Gratitud", recuerdo: "Recuerdo", web: "Imagen web" };

export function Fragments({ items }: { items: Frag[] }) {
  const [pending, start] = useTransition();
  if (!items.length)
    return (
      <p className="m-0 rounded-2xl border border-dashed border-[rgba(255,214,180,0.18)] px-5 py-6 text-sm leading-relaxed text-umber">
        Aún no hay fragmentos hoy. Usa la barra de abajo para guardar una idea, algo que agradeces, un recuerdo o el enlace de una imagen.
      </p>
    );
  return (
    <>
      {items.map((f) => {
        const time = f.createdAt.slice(11, 16);
        const del = (
          <button
            type="button"
            aria-label="Eliminar fragmento"
            disabled={pending}
            onClick={() => start(() => deleteFragment(f.id))}
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
          >
            <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        );
        if (f.kind === "web" && f.imageUrl)
          return (
            <figure key={f.id} className="glass-warm group m-0 overflow-hidden rounded-[18px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.imageUrl} alt="Imagen guardada de la web" className="block h-40 w-full object-cover" />
              <figcaption className="flex items-center gap-2 px-4 py-3 font-mono text-[10px] tracking-[0.12em] text-umber">
                IMAGEN WEB · {time}
                {f.url && (
                  <a href={f.url} target="_blank" rel="noreferrer" className="truncate">
                    fuente ↗
                  </a>
                )}
                {del}
              </figcaption>
            </figure>
          );
        const styles =
          f.kind === "nota"
            ? "bg-cream text-[#2B2420]"
            : f.kind === "gratitud"
              ? "bg-vermilion text-[#1A1512]"
              : "glass-warm text-cream";
        return (
          <div key={f.id} className={`group flex flex-col gap-2 rounded-[18px] px-5 py-4 ${styles}`}>
            <span className="flex items-center font-mono text-[10px] tracking-[0.12em] opacity-75">
              {LABEL[f.kind].toUpperCase()} · {time}
              {del}
            </span>
            <span className={f.kind === "nota" ? "font-sans text-lg font-medium leading-snug" : "font-sans text-lg font-semibold leading-snug tracking-[-0.01em]"}>{f.text}</span>
          </div>
        );
      })}
    </>
  );
}
