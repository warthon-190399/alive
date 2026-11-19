import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/knowledge/Interests";
import { Questions } from "@/components/knowledge/Questions";
import { Queue } from "@/components/knowledge/Queue";
import { Sparks } from "@/components/knowledge/Sparks";
import { getKnowledge } from "@/lib/knowledge";

export const dynamic = "force-dynamic";

const STAGE_NOTE: Record<string, string> = {
  curiosidad: "Te llama la atención. Guarda chispas y preguntas sin presión.",
  explorando: "Lo estás explorando: lecturas en curso y preguntas que se afinan.",
  profundizando: "Vas en serio. Lo profundo vive en Philopon; aquí ves hacia dónde va.",
};

export default async function InterestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const k = await getKnowledge();
  const i = k.interests.find((x) => x.id === Number(id));
  if (!i) notFound();
  const list = k.interests.map((x) => ({ id: x.id, name: x.name }));
  const questions = k.questions.filter((q) => q.interestId === i.id);
  const queue = k.queue.filter((q) => q.interestId === i.id);
  const sparks = k.sparks.filter((s) => s.interestId === i.id);
  const others = k.interests.filter((x) => x.id !== i.id);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="eyebrow text-faint">06 — Knowledge · Territorio</span>
        <Link href="/knowledge" className="text-sm">← Todos los territorios</Link>
      </div>

      <div className="mt-4">
        <Card key={i.id} i={i} detail />
      </div>
      <p className="m-0 mt-3 text-sm text-muted">
        {STAGE_NOTE[i.stage]}
        {i.stageChangedAt ? ` · nivel actualizado el ${i.stageChangedAt.slice(8)}/${i.stageChangedAt.slice(5, 7)}` : ""}
      </p>

      <section aria-label="Preguntas, cola y chispas" className="mt-7 flex flex-wrap gap-5">
        <div className="glass min-w-0 flex-[3_1_420px] rounded-[20px] p-7">
          <span className="eyebrow text-faint">Preguntas de este territorio</span>
          <div className="mt-3"><Questions items={questions} interests={list} fixedInterestId={i.id} /></div>
        </div>
        <div className="flex min-w-0 flex-[2_1_360px] flex-col gap-5">
          <div className="glass rounded-[20px] p-6">
            <span className="eyebrow text-faint">Cola de exploración</span>
            <div className="mt-2"><Queue items={queue} interests={list} fixedInterestId={i.id} /></div>
          </div>
          <div className="glass rounded-[20px] p-6">
            <span className="eyebrow text-faint">Chispas</span>
            <div className="mt-3"><Sparks items={sparks} interests={list} fixedInterestId={i.id} /></div>
          </div>
        </div>
      </section>

      {others.length > 0 && (
        <nav aria-label="Otros territorios" className="mt-8 flex flex-wrap items-center gap-2">
          <span className="eyebrow mr-2 text-faint">Otros territorios</span>
          {others.map((o) => (
            <Link key={o.id} href={`/knowledge/${o.id}`} className="rounded-full border border-white/12 px-3.5 py-2 text-[13px] text-[#C9C5BC] no-underline hover:text-ink">{o.name}</Link>
          ))}
        </nav>
      )}
    </>
  );
}
