import { AlignmentMap } from "@/components/strategy/AlignmentMap";
import { Goals } from "@/components/strategy/Goals";
import { Pillars } from "@/components/strategy/Pillars";
import { VisionBoard } from "@/components/strategy/VisionBoard";
import { VisionCard } from "@/components/strategy/VisionCard";
import { PageHeader, SectionTitle } from "@/components/ui";
import { monthKey, MONTHS, today } from "@/lib/dates";
import { getBoard, getGoals, getPillars, getProjects, getVision } from "@/lib/strategy";

export const dynamic = "force-dynamic";

export default async function StrategyPage() {
  const month = monthKey(today());
  const [vision, pillars, goals, projects, board] = await Promise.all([getVision(), getPillars(month), getGoals(), getProjects(), getBoard()]);
  const cover = board.find((b) => b.kind === "image")?.url;
  const monthName = MONTHS[Number(month.slice(5)) - 1];

  return (
    <>
      <PageHeader eyebrow="02 — Life Strategy" title="la vida que estoy" accent="diseñando." />

      <VisionCard initial={{ statement: vision.statement, year: vision.year, values: vision.values }} cover={cover} />

      <section aria-label="Pilares" className="mt-9">
        <SectionTitle right={<span className="text-[13px] text-muted">Cada objetivo vive en un pilar · puntúa cómo vas cada mes</span>}>pilares</SectionTitle>
        <Pillars items={pillars} month={month} monthLabel={monthName} />
      </section>

      <section aria-label="Mapa de alineación" className="mt-9">
        <SectionTitle right={<span className="text-[13px] text-muted">Cada proyecto responde a un objetivo, y cada objetivo a un pilar</span>}>mapa de alineación</SectionTitle>
        <AlignmentMap pillars={pillars} goals={goals} projects={projects} />
      </section>

      <section aria-label="Objetivos por horizonte" className="mt-9">
        <SectionTitle>objetivos por horizonte</SectionTitle>
        <Goals goals={goals} pillars={pillars.map((p) => ({ id: p.id, name: p.name }))} year={vision.year} />
      </section>

      <section aria-label="Vision board" className="mt-9">
        <SectionTitle>vision board</SectionTitle>
        <VisionBoard items={board} />
      </section>
    </>
  );
}
