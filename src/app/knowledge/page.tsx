import { Interests } from "@/components/knowledge/Interests";
import { Questions } from "@/components/knowledge/Questions";
import { Queue } from "@/components/knowledge/Queue";
import { Sparks } from "@/components/knowledge/Sparks";
import { PageHeader, SectionTitle } from "@/components/ui";
import { getKnowledge } from "@/lib/knowledge";

export const dynamic = "force-dynamic";

export default async function KnowledgePage() {
  const k = await getKnowledge();
  const list = k.interests.map((i) => ({ id: i.id, name: i.name }));
  return (
    <>
      <PageHeader eyebrow="06 — Knowledge Interests" title="lo que quiero" accent="entender.">
        <div className="flex flex-wrap gap-7">
          <Kpi v={k.interests.length} l="territorios" />
          <Kpi v={k.questions.filter((q) => q.status === "abierta").length} l="preguntas abiertas" accent />
          <Kpi v={k.queue.filter((q) => q.status === "cola" || q.status === "explorando").length} l="en cola" />
        </div>
      </PageHeader>
      <p className="m-0 mt-3 max-w-2xl text-sm text-muted">Lo que despierta tu curiosidad y hacia dónde va. Lo que se vuelve estudio serio pasa a Philopon.</p>

      <section aria-label="Territorios" className="mt-8">
        <SectionTitle right={<span className="flex gap-4 text-xs text-muted"><span>○ Curiosidad</span><span>◐ Explorando</span><span className="text-[#FF8A55]">● Profundizando</span></span>}>territorios</SectionTitle>
        <Interests items={k.interests} />
      </section>

      <section aria-label="Preguntas y cola" className="mt-8 flex flex-wrap gap-5">
        <div className="glass min-w-0 flex-[3_1_420px] rounded-[20px] p-7">
          <span className="eyebrow text-faint">Preguntas abiertas</span>
          <div className="mt-3"><Questions items={k.questions} interests={list} /></div>
        </div>
        <div className="flex min-w-0 flex-[2_1_360px] flex-col gap-5">
          <div className="glass rounded-[20px] p-6">
            <span className="eyebrow text-faint">Cola de exploración</span>
            <div className="mt-2"><Queue items={k.queue} interests={list} /></div>
          </div>
          <div className="glass rounded-[20px] p-6">
            <span className="eyebrow text-faint">Chispas</span>
            <div className="mt-3"><Sparks items={k.sparks} interests={list} /></div>
          </div>
        </div>
      </section>
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
