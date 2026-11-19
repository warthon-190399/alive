import Link from "next/link";
import { createProject } from "@/actions/projects";
import { PageHeader, SectionTitle } from "@/components/ui";
import { addMonths, monthKey, MONTHS_SHORT, today } from "@/lib/dates";
import { getGoals, getProjects, type ProjectView } from "@/lib/strategy";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = { idea: "Idea", activo: "Activo", pausado: "Pausado", hecho: "Hecho" };

export default async function ProjectsPage() {
  const now = today();
  const [projects, goals] = await Promise.all([getProjects(), getGoals()]);
  const active = projects.filter((p) => p.status === "activo");
  const focus = projects.find((p) => p.focus && p.status !== "hecho") ?? active[0];
  const others = projects.filter((p) => p.status !== "hecho" && p.id !== focus?.id);
  const done = projects.filter((p) => p.status === "hecho");
  const thisMonth = monthKey(now);
  const msThisMonth = projects.flatMap((p) => p.milestones).filter((m) => !m.done && m.due?.startsWith(thisMonth)).length;

  return (
    <>
      <PageHeader eyebrow="03 — Projects" title="lo que estoy" accent="construyendo.">
        <div className="flex flex-wrap gap-7">
          <Kpi v={active.length} l="proyectos activos" />
          <Kpi v={projects.reduce((a, p) => a + p.openTasks, 0)} l="tareas abiertas" />
          <Kpi v={msThisMonth} l="hitos este mes" accent />
        </div>
      </PageHeader>

      <form action={createProject} className="glass mt-7 flex flex-wrap gap-2 rounded-[18px] p-3">
        <label className="min-w-56 flex-[3_1_260px]">
          <span className="sr-only">Nombre del proyecto</span>
          <input name="name" required placeholder="Nuevo proyecto" className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm outline-none placeholder:text-faint" />
        </label>
        <label className="flex-[2_1_200px]">
          <span className="sr-only">Objetivo</span>
          <select name="goalId" className="h-11 w-full rounded-xl border border-white/10 bg-[#1c1b1a] px-3 text-sm text-ink outline-none">
            <option value="">Sin objetivo</option>
            {goals.filter((g) => g.status === "activo").map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
          </select>
        </label>
        <label className="flex flex-[1_1_150px] items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-xs text-muted">
          Entrega
          <input name="due" type="date" className="h-11 min-w-0 flex-1 border-0 bg-transparent text-sm text-ink outline-none [color-scheme:dark]" />
        </label>
        <button type="submit" className="h-11 rounded-xl bg-vermilion px-5 text-sm font-bold text-obsidian">Crear proyecto</button>
      </form>

      {focus ? <FocusHero p={focus} /> : (
        <p className="glass mt-6 rounded-[22px] px-7 py-10 text-center text-muted">Crea tu primer proyecto. Si lo ligas a un objetivo, aparecerá en el mapa de alineación de Strategy.</p>
      )}

      {others.length > 0 && (
        <section aria-label="Otros proyectos" className="mt-8">
          <SectionTitle>en movimiento</SectionTitle>
          <div className="flex flex-wrap gap-3.5">
            {others.map((p) => <ProjectCard key={p.id} p={p} />)}
          </div>
        </section>
      )}

      {projects.some((p) => p.status !== "hecho") && <Timeline projects={projects.filter((p) => p.status !== "hecho")} now={now} />}

      {done.length > 0 && (
        <section aria-label="Proyectos terminados" className="mt-8">
          <SectionTitle>terminados</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {done.map((p) => (
              <Link key={p.id} href={`/projects/${p.id}`} className="rounded-full border border-white/10 px-4 py-2 text-sm text-muted no-underline hover:text-ink">✓ {p.name}</Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function Kpi({ v, l, accent }: { v: number; l: string; accent?: boolean }) {
  return (
    <span className="flex flex-col">
      <span className={`font-display text-[40px] leading-none ${accent ? "text-vermilion" : ""}`}>{v}</span>
      <span className="text-xs text-muted">{l}</span>
    </span>
  );
}

function Cover({ p, className }: { p: ProjectView; className: string }) {
  return p.cover ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={p.cover} alt="" className={`${className} object-cover`} />
  ) : (
    <div aria-hidden="true" className={className} style={{ background: `radial-gradient(circle at ${30 + ((p.id * 37) % 50)}% 40%, rgba(255,87,46,0.6), rgba(169,47,39,0.35) 45%, rgba(20,20,20,0.9) 80%)` }} />
  );
}

function FocusHero({ p }: { p: ProjectView }) {
  const ms = p.milestones.slice(0, 6);
  return (
    <section aria-label="Proyecto en foco" className="glass mt-6 flex flex-wrap overflow-hidden rounded-[22px]">
      <div className="relative min-h-72 min-w-0 flex-[2_1_300px]">
        <Cover p={p} className="absolute inset-0 h-full w-full" />
        <span className="eyebrow absolute left-5 top-5 rounded-full bg-black/60 px-3 py-1.5 text-ink">{p.focus ? "En foco" : "Activo"}</span>
      </div>
      <div className="flex min-w-0 flex-[3_1_460px] flex-col gap-5 px-8 py-8">
        <div className="flex flex-wrap justify-between gap-4">
          <div className="flex flex-col gap-2">
            <span className="eyebrow text-[#FF8A55]">{[p.pillar?.name, p.goal?.title].filter(Boolean).join(" · ") || "Sin objetivo"}</span>
            <Link href={`/projects/${p.id}`} className="font-display text-[40px] leading-none text-ink no-underline">{p.name}</Link>
            {p.description && <p className="m-0 line-clamp-2 max-w-xl text-sm leading-relaxed text-muted">{p.description}</p>}
          </div>
          <span className="flex flex-col items-end">
            <span className="font-display text-[56px] leading-none">{p.progress}%</span>
            <span className="text-xs text-muted">{p.due ? `entrega · ${p.due.slice(8)}/${p.due.slice(5, 7)}` : "sin fecha"}</span>
          </span>
        </div>
        {ms.length ? (
          <ol aria-label="Hitos" className="m-0 mt-2 grid list-none p-0" style={{ gridTemplateColumns: `repeat(${ms.length}, minmax(0, 1fr))` }}>
            {ms.map((m, i) => {
              const current = !m.done && ms.findIndex((x) => !x.done) === i;
              return (
                <li key={m.id} className="flex flex-col gap-2.5">
                  <span className="flex items-center">
                    <span aria-hidden="true" className="box-border h-3.5 w-3.5 flex-none rounded-full border-2" style={{ background: m.done ? "#FF572E" : "#141414", borderColor: m.done || current ? "#FF572E" : "#3A3935" }} />
                    {i < ms.length - 1 && <span aria-hidden="true" className="h-0.5 flex-1" style={{ background: m.done ? "#FF572E" : "#2A2926" }} />}
                  </span>
                  <span className={`pr-2 text-[13px] ${m.done || current ? "" : "text-muted"}`}>{m.title}</span>
                  <span className="font-mono text-[10px] text-faint">{m.done ? "hecho" : m.due ? `${m.due.slice(8)}/${m.due.slice(5, 7)}` : current ? "en curso" : "—"}</span>
                </li>
              );
            })}
          </ol>
        ) : (
          <Link href={`/projects/${p.id}`} className="text-sm">Añade hitos para ver la línea de avance →</Link>
        )}
      </div>
    </section>
  );
}

function ProjectCard({ p }: { p: ProjectView }) {
  return (
    <Link href={`/projects/${p.id}`} className="glass flex min-w-0 max-w-[440px] flex-[1_1_240px] flex-col overflow-hidden rounded-[18px] text-ink no-underline">
      <Cover p={p} className="block h-24 w-full" />
      <span className="flex flex-col gap-2.5 px-[18px] pb-[18px] pt-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-faint">{STATUS_LABEL[p.status]}{p.pillar ? ` · ${p.pillar.name}` : ""}</span>
        <span className="font-display text-2xl leading-tight">{p.name}</span>
        <span className="text-xs text-muted">{p.nextTask ? `Próximo: ${p.nextTask}` : p.nextMilestone ? `Hito: ${p.nextMilestone.title}` : `${p.openTasks} tareas abiertas`}</span>
        <span className="flex items-center gap-2.5">
          <span className="h-1 flex-1 overflow-hidden rounded bg-white/[0.08]"><span className="block h-full bg-vermilion" style={{ width: `${p.progress}%` }} /></span>
          <span className="font-mono text-[11px] text-[#C9C5BC]">{p.progress}%</span>
        </span>
      </span>
    </Link>
  );
}

function Timeline({ projects, now }: { projects: ProjectView[]; now: string }) {
  const start = monthKey(now);
  const months = Array.from({ length: 5 }, (_, i) => addMonths(start, i));
  const t0 = new Date(`${start}-01T00:00:00Z`).getTime();
  const t1 = new Date(`${addMonths(start, 5)}-01T00:00:00Z`).getTime();
  const pos = (d: string) => Math.max(0, Math.min(1, (new Date(`${d}T12:00:00Z`).getTime() - t0) / (t1 - t0)));
  return (
    <section aria-label="Línea de tiempo" className="glass mt-8 rounded-[22px] px-7 py-6">
      <SectionTitle right={<span className="text-[13px] text-muted">próximos 5 meses</span>}>línea de tiempo</SectionTitle>
      <div className="overflow-x-auto">
        <div className="relative min-w-[760px]">
          <div className="grid grid-cols-[200px_repeat(5,minmax(0,1fr))] border-b border-white/[0.08] pb-2.5">
            <span />
            {months.map((m) => <span key={m} className="font-mono text-[11px] text-faint">{MONTHS_SHORT[Number(m.slice(5)) - 1]}</span>)}
          </div>
          {projects.map((p) => {
            const a = pos(p.start ?? p.createdAt.slice(0, 10));
            const b = p.due ? pos(p.due) : 1;
            return (
              <div key={p.id} className="grid h-[52px] grid-cols-[200px_minmax(0,1fr)] items-center border-b border-white/[0.05]">
                <Link href={`/projects/${p.id}`} className="truncate pr-3 text-sm text-ink no-underline">{p.name}</Link>
                <span className="relative block h-6">
                  <span
                    className="absolute flex h-6 items-center overflow-hidden whitespace-nowrap rounded-full px-3 text-[11px]"
                    style={{
                      left: `${a * 100}%`,
                      width: `${Math.max(4, (b - a) * 100)}%`,
                      background: p.focus ? "#FF572E" : p.status === "activo" ? "#F4EADB" : "#3A3935",
                      color: p.focus || p.status === "activo" ? "#141414" : "#F3F1EC",
                      borderStyle: p.due ? "none" : "dashed",
                    }}
                  >
                    {p.nextMilestone?.title ?? (p.due ? "" : "sin fecha de entrega")}
                  </span>
                </span>
              </div>
            );
          })}
          <span aria-hidden="true" className="absolute bottom-0 top-6 w-px bg-vermilion" style={{ left: `calc(200px + (100% - 200px) * ${pos(now)})` }} />
        </div>
      </div>
    </section>
  );
}
