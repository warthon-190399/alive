"use client";

/** Calificación de 1 a 5 estrellas. Sin onChange se muestra solo para leer. */
export function Stars({ value, onChange, size = 18 }: { value: number | null; onChange?: (v: number | null) => void; size?: number }) {
  const v = value ?? 0;
  if (!onChange)
    return (
      <span role="img" aria-label={value ? `${value} de 5 estrellas` : "Sin calificar"} className="inline-flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => <Star key={i} on={i <= v} size={size} />)}
      </span>
    );
  return (
    <span role="radiogroup" aria-label="Calificación" className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={v === i}
          aria-label={`${i} estrella${i > 1 ? "s" : ""}`}
          onClick={() => onChange(v === i ? null : i)}
          className="flex h-9 w-8 items-center justify-center"
        >
          <Star on={i <= v} size={size} />
        </button>
      ))}
    </span>
  );
}

function Star({ on, size }: { on: boolean; size: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill={on ? "#FF572E" : "none"} stroke={on ? "#FF572E" : "rgba(255,255,255,0.3)"} strokeWidth="1.6" strokeLinejoin="round">
      <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.8z" />
    </svg>
  );
}
