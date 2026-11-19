import "server-only";
import { asc, desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { mediaMap } from "./media-url";

export async function getKnowledge() {
  const db = await getDb();
  const interests = await db.select().from(schema.interests).where(eq(schema.interests.archived, false)).orderBy(asc(schema.interests.sort), asc(schema.interests.id));
  const questions = await db.select().from(schema.questions).orderBy(desc(schema.questions.id));
  const queue = await db.select().from(schema.queueItems).orderBy(desc(schema.queueItems.id));
  const sparks = await db.select().from(schema.sparks).orderBy(desc(schema.sparks.id)).limit(30);
  const covers = await mediaMap([...queue.map((q) => q.coverMediaId), ...interests.map((i) => i.coverMediaId)].filter((x): x is number => x != null));
  const name = (id: number | null) => interests.find((i) => i.id === id)?.name ?? null;
  return {
    interests: interests.map((i) => ({
      ...i,
      cover: i.coverMediaId ? covers[i.coverMediaId] : undefined,
      openQuestions: questions.filter((q) => q.interestId === i.id && q.status === "abierta").length,
      queueCount: queue.filter((q) => q.interestId === i.id && (q.status === "cola" || q.status === "explorando")).length,
      sparkCount: sparks.filter((s) => s.interestId === i.id).length,
    })),
    questions: questions.map((q) => ({ ...q, interest: name(q.interestId) })),
    queue: queue.map((q) => ({ ...q, interest: name(q.interestId), cover: q.coverMediaId ? covers[q.coverMediaId] : undefined })),
    sparks: sparks.map((s) => ({ ...s, interest: name(s.interestId) })),
  };
}
export type KnowledgeData = Awaited<ReturnType<typeof getKnowledge>>;
