import { Suspense } from "react";
import { connection } from "next/server";
import { listDueCards } from "@/lib/db";
import { ReviewSession } from "@/components/review-session";

export default function ReviewPage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Revisão de hoje</h1>
      <Suspense fallback={<p className="text-stone-500">Carregando cards…</p>}>
        <DueCards />
      </Suspense>
    </>
  );
}

async function DueCards() {
  await connection();
  const cards = shuffle(await listDueCards());
  // A key garante que a sessão reinicie com dados novos a cada visita.
  return <ReviewSession key={cards.map((c) => c.id).join()} cards={cards} />;
}

/** Fisher–Yates: ordem aleatória, independente da ordem de criação. */
function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
