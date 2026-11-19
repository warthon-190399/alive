import Link from "next/link";

type P = { id: number; name: string; score: number | null };
type G = { id: number; title: string; pillarId: number | null; shownProgress: number; status: string };
type Pr = { id: number; name: string; goal: { id: number } | null; progress: number; status: string; focus: boolean };

const COLS = [0, 430, 860];
const W = 260;
const H = 64;
const GAP = 14;

/** Mapa pilar → objetivo → proyecto, con conectores curvos. */
export function AlignmentMap({ pillars, goals, projects }: { pillars: P[]; goals: G[]; projects: Pr[] }) {
  const activeGoals = goals.filter((g) => g.status === "activo");
  const pOrder = new Map(pillars.map((p, i) => [p.id, i]));
  const gSorted = [...activeGoals].sort((a, b) => (pOrder.get(a.pillarId ?? -1) ?? 999) - (pOrder.get(b.pillarId ?? -1) ?? 999));
  const gOrder = new Map(gSorted.map((g, i) => [g.id, i]));
  const prSorted = projects
    .filter((p) => p.status !== "hecho")
    .sort((a, b) => (gOrder.get(a.goal?.id ?? -1) ?? 999) - (gOrder.get(b.goal?.id ?? -1) ?? 999));

  const y = (i: number) => 28 + i * (H + GAP);
  const pY = new Map(pillars.map((p, i) => [p.id, y(i)]));
  const gY = new Map(gSorted.map((g, i) => [g.id, y(i)]));
  const prY = new Map(prSorted.map((p, i) => [p.id, y(i)]));
  const rows = Math.max(pillars.length, gSorted.length, prSorted.length, 1);
  const height = y(rows) + 4;

  const edges: { x1: number; y1: number; x2: number; y2: number; hot: boolean }[] = [];
  for (const g of gSorted)
    if (g.pillarId != null && pY.has(g.pillarId)) edges.push({ x1: COLS[0] + W, y1: pY.get(g.pillarId)! + H / 2, x2: COLS[1], y2: gY.get(g.id)! + H / 2, hot: false });
  for (const p of prSorted)
    if (p.goal && gY.has(p.goal.id)) edges.push({ x1: COLS[1] + W, y1: gY.get(p.goal.id)! + H / 2, x2: COLS[2], y2: prY.get(p.id)! + H / 2, hot: p.focus });

  if (!pillars.length && !gSorted.length && !prSorted.length)
    return <p className="glass m-0 rounded-[20px] px-6 py-8 text-muted">Crea pilares, objetivos y proyectos para ver cómo se conectan.</p>;

  return (
    <div className="overflow-x-auto rounded-3xl border border-white/[0.07] bg-white/[0.025] p-7">
      <div className="relative mx-auto" style={{ width: 1120, height }}>
        {["Pilar", "Objetivo", "Proyecto"].map((l, i) => (
          <span key={l} className="eyebrow absolute top-0 text-faint" style={{ left: COLS[i] }}>{l}</span>
        ))}
        <svg aria-hidden="true" width={1120} height={height} className="absolute inset-0">
          {edges.map((e, i) => (
            <g key={i}>
              <path d={`M${e.x1} ${e.y1} C${e.x1 + 85} ${e.y1}, ${e.x2 - 85} ${e.y2}, ${e.x2} ${e.y2}`} fill="none" stroke={e.hot ? "#FF572E" : "rgba(255,140,90,0.5)"} strokeWidth="1.5" />
              <circle cx={e.x1} cy={e.y1} r="5" fill="#141414" stroke="#FF572E" strokeWidth="2" />
              <circle cx={e.x2} cy={e.y2} r="5" fill="#FF572E" />
            </g>
          ))}
        </svg>
        {pillars.map((p) => (
          <Node key={`p${p.id}`} x={COLS[0]} y={pY.get(p.id)!} letter={p.name[0]} label="Pilar" title={p.name} meta={p.score != null ? `${p.score}/100 este mes` : "sin puntaje este mes"} />
        ))}
        {gSorted.map((g) => (
          <Node key={`g${g.id}`} x={COLS[1]} y={gY.get(g.id)!} letter={g.title[0]} label="Objetivo" title={g.title} meta={`${g.shownProgress}%`} />
        ))}
        {prSorted.map((p) => (
          <Node key={`r${p.id}`} x={COLS[2]} y={prY.get(p.id)!} letter={p.name[0]} label={p.goal ? "Proyecto" : "Proyecto · sin objetivo"} title={p.name} meta={`${p.progress}% · ${p.status}`} hot={p.focus} href={`/projects/${p.id}`} faded={!p.goal} />
        ))}
      </div>
    </div>
  );
}

function Node({ x, y, letter, label, title, meta, hot, href, faded }: { x: number; y: number; letter: string; label: string; title: string; meta: string; hot?: boolean; href?: string; faded?: boolean }) {
  const inner = (
    <>
      <span aria-hidden="true" className={`flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[10px] text-lg font-bold uppercase ${hot ? "bg-vermilion text-obsidian" : "bg-white/[0.08]"}`}>{letter}</span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted">{label}</span>
        <span className="truncate text-sm">{title}</span>
        <span className="text-[11px] text-muted">{meta}</span>
      </span>
    </>
  );
  const cls = `absolute flex items-center gap-3 rounded-[18px] border px-4 backdrop-blur-xl text-ink no-underline ${hot ? "border-vermilion/60" : "border-white/10"} ${faded ? "opacity-60" : ""}`;
  const style = { left: x, top: y, width: W, height: H, background: "rgba(28,24,22,0.78)" };
  return href ? (
    <Link href={href} className={cls} style={style}>{inner}</Link>
  ) : (
    <div className={cls} style={style}>{inner}</div>
  );
}
