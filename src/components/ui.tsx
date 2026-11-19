import Link from "next/link";

export function PageHeader({
  eyebrow,
  title,
  accent,
  warm = false,
  children,
}: {
  eyebrow: string;
  title: string;
  accent: string;
  warm?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-6 pt-2">
      <div className="flex flex-col gap-2.5">
        <span className={`eyebrow ${warm ? "text-umber" : "text-faint"}`}>{eyebrow}</span>
        <h1 className={`m-0 font-display text-5xl leading-[0.95] tracking-[-0.045em] md:text-[64px] ${warm ? "text-cream" : ""}`}>
          {title} <em className={`not-italic ${warm ? "text-[#FF8A55]" : "text-vermilion"}`}>{accent}</em>
        </h1>
      </div>
      {children}
    </header>
  );
}

export function SectionTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
      <h2 className="lowercase m-0 font-display text-[30px]">{children}</h2>
      {right}
    </div>
  );
}

export function Placeholder({ eyebrow, title, accent, phase, items }: { eyebrow: string; title: string; accent: string; phase: string; items: string[] }) {
  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} accent={accent} />
      <section className="glass mt-8 rounded-3xl p-8 md:p-10">
        <span className="eyebrow text-[#FF8A55]">{phase} · en construcción</span>
        <p className="mb-6 mt-3 max-w-2xl font-display text-3xl leading-tight">Este módulo llega en la siguiente fase. Así quedará, según el diseño:</p>
        <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
          {items.map((it) => (
            <li key={it} className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-[#C9C5BC]">
              {it}
            </li>
          ))}
        </ul>
        <Link href="/" className="mt-8 inline-block text-sm">
          ← Volver a Overview
        </Link>
      </section>
    </>
  );
}
