"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark, Wordmark } from "./Logo";

const NAV = [
  { href: "/", label: "Overview" },
  { href: "/strategy", label: "Strategy" },
  { href: "/projects", label: "Projects" },
  { href: "/journal", label: "Journal" },
  { href: "/habits", label: "Habits" },
  { href: "/knowledge", label: "Knowledge" },
  { href: "/experiences", label: "Experiences" },
];

type Glow = [left: number, top: number, size: number, color: string];
const GLOWS: Record<string, Glow[]> = {
  "/": [[62, -140, 760, "rgba(255,87,46,0.30)"], [-10, 760, 600, "rgba(169,47,39,0.30)"]],
  "/strategy": [[70, -60, 660, "rgba(249,115,22,0.26)"], [8, 900, 640, "rgba(169,47,39,0.30)"]],
  "/projects": [[-10, 120, 640, "rgba(255,87,46,0.26)"], [75, 860, 580, "rgba(169,47,39,0.28)"]],
  "/journal": [[55, -100, 800, "rgba(249,115,22,0.32)"], [-12, 620, 660, "rgba(255,87,46,0.26)"], [78, 1080, 540, "rgba(169,47,39,0.30)"]],
  "/habits": [[78, 80, 640, "rgba(255,87,46,0.26)"], [5, 980, 580, "rgba(169,47,39,0.28)"]],
  "/knowledge": [[40, -160, 780, "rgba(249,115,22,0.24)"], [85, 780, 540, "rgba(169,47,39,0.30)"]],
  "/experiences": [[60, 220, 740, "rgba(255,87,46,0.30)"], [-10, 1080, 580, "rgba(169,47,39,0.28)"]],
};

function section(pathname: string) {
  if (pathname === "/") return "/";
  const s = "/" + pathname.split("/")[1];
  return NAV.some((n) => n.href === s) ? s : "/";
}

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const current = section(pathname);
  const warm = current === "/journal";
  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: warm ? "#17110E" : "#141414" }}>
      {GLOWS[current].map(([l, t, s, c], i) => (
        <div
          key={`${current}-${i}`}
          aria-hidden="true"
          className="pointer-events-none absolute rounded-full"
          style={{ left: `${l}%`, top: t, width: s, height: s, background: `radial-gradient(circle, ${c} 0%, rgba(0,0,0,0) 68%)`, filter: "blur(40px)" }}
        />
      ))}
      <header className="relative z-10 flex flex-wrap items-center justify-between gap-4 px-6 py-5 md:px-10">
        <Link href="/" aria-label="alive, inicio" className="flex min-h-11 items-center gap-2.5 text-ink no-underline">
          <LogoMark />
          <Wordmark />
        </Link>
        <nav aria-label="Módulos" className="flex max-w-full gap-0.5 overflow-x-auto rounded-[26px] border border-white/10 bg-white/5 p-1 backdrop-blur-xl">
          {NAV.map((n) => {
            const on = n.href === current;
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={on ? "page" : undefined}
                className={`flex min-h-11 items-center whitespace-nowrap rounded-[22px] px-[18px] text-[13px] font-medium no-underline transition-colors ${
                  on ? "bg-white/90 text-obsidian" : "text-[#B5B1A9] hover:text-ink"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2.5">
          <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-full bg-vermilion text-sm font-bold text-obsidian">
            T
          </span>
          <Link
            href="/journal"
            className="flex h-11 items-center gap-2 rounded-[22px] bg-ink px-5 text-[13px] font-bold text-obsidian no-underline"
          >
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Capturar
          </Link>
        </div>
      </header>
      <main className="relative z-[1] mx-auto box-border max-w-[1360px] px-6 pb-24 pt-4 md:px-10">{children}</main>
    </div>
  );
}
