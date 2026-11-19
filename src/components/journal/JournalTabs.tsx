import Link from "next/link";

const TABS = [
  { k: "hoy", l: "Hoy", href: "/journal" },
  { k: "mes", l: "Mes", href: "/journal/mes" },
  { k: "tiempo", l: "Tiempo", href: "/journal/tiempo" },
] as const;

export function JournalTabs({ active }: { active: (typeof TABS)[number]["k"] }) {
  return (
    <nav aria-label="Vistas del journal" className="mt-5 flex w-fit gap-0.5 rounded-3xl border border-[rgba(255,214,180,0.12)] bg-[rgba(255,214,180,0.06)] p-1">
      {TABS.map((t) => (
        <Link
          key={t.k}
          href={t.href}
          aria-current={t.k === active ? "page" : undefined}
          className={`flex min-h-11 items-center rounded-[20px] px-[22px] text-[13px] font-medium no-underline ${t.k === active ? "bg-vermilion text-[#140E0A]" : "text-sand hover:text-cream"}`}
        >
          {t.l}
        </Link>
      ))}
    </nav>
  );
}
