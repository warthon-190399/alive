import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Board } from "@/components/projects/Board";
import { Milestones } from "@/components/projects/Milestones";
import { ProjectHeader } from "@/components/projects/ProjectHeader";
import { SectionTitle } from "@/components/ui";
import { getDb, schema } from "@/db";
import { getGoals, getProjects } from "@/lib/strategy";

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pid = Number(id);
  const [projects, goals] = await Promise.all([getProjects(), getGoals()]);
  const p = projects.find((x) => x.id === pid);
  if (!p) notFound();
  const db = await getDb();
  const tasks = await db.select().from(schema.tasks).where(eq(schema.tasks.projectId, pid)).orderBy(asc(schema.tasks.sort));

  return (
    <>
      <span className="eyebrow text-faint">03 — Projects</span>
      <ProjectHeader
        key={p.id}
        p={{ id: p.id, name: p.name, description: p.description, goalId: p.goalId, status: p.status, start: p.start, due: p.due, focus: p.focus, cover: p.cover, progress: p.progress, pillarName: p.pillar?.name ?? null }}
        goals={goals.filter((g) => g.status === "activo" || g.id === p.goalId).map((g) => ({ id: g.id, title: g.title }))}
      />
      <section aria-label="Tablero" className="mt-8">
        <SectionTitle right={<span className="text-[13px] text-muted">Arrastra las tareas entre columnas</span>}>tablero</SectionTitle>
        <Board projectId={p.id} tasks={tasks.map((t) => ({ id: t.id, title: t.title, status: t.status }))} />
      </section>
      <section aria-label="Hitos" className="glass mt-8 max-w-3xl rounded-[22px] px-7 py-6">
        <SectionTitle>hitos</SectionTitle>
        <Milestones projectId={p.id} items={p.milestones.map((m) => ({ id: m.id, title: m.title, due: m.due, done: m.done }))} />
      </section>
    </>
  );
}
