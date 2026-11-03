import "server-only";
import { addDays, intervalAfterReview, isDue, today } from "./schedule";
import { getStorage } from "./storage";

export type Card = {
  id: string;
  /** HTML já sanitizado. */
  content: string;
  /** Instante de criação (ISO 8601). */
  createdAt: string;
  /** Data de criação no fuso da aplicação (YYYY-MM-DD). */
  createdOn: string;
  /** Próxima data em que o card deve aparecer (YYYY-MM-DD). */
  nextReviewDate: string;
  /** Quantidade de revisões concluídas. */
  reviewCount: number;
  /** Datas (YYYY-MM-DD) em que as revisões foram concluídas. */
  reviewHistory: string[];
  updatedAt: string;
};

/*
 * Onde os cards ficam guardados (ver storage.ts):
 *  - Na Vercel: Upstash Redis.
 *  - Localmente: memória + arquivo data/cards.json.
 */

export async function listDueCards(ref: string = today()): Promise<Card[]> {
  const cards = await getStorage().all();
  return cards.filter((c) => isDue(c.nextReviewDate, ref));
}

export async function getCard(id: string): Promise<Card | undefined> {
  return getStorage().get(id);
}

export async function insertCard(content: string): Promise<Card> {
  const now = new Date();
  const createdOn = today(now);
  const card: Card = {
    id: crypto.randomUUID(),
    content,
    createdAt: now.toISOString(),
    createdOn,
    nextReviewDate: createdOn,
    reviewCount: 0,
    reviewHistory: [],
    updatedAt: now.toISOString(),
  };
  await getStorage().put(card);
  return card;
}

export async function markReviewed(card: Card): Promise<Card> {
  const reviewedOn = today();
  const reviewCount = card.reviewCount + 1;
  const updated: Card = {
    ...card,
    reviewCount,
    reviewHistory: [...card.reviewHistory, reviewedOn],
    nextReviewDate: addDays(reviewedOn, intervalAfterReview(reviewCount)),
    updatedAt: new Date().toISOString(),
  };
  await getStorage().put(updated);
  return updated;
}

export async function updateCardContent(card: Card, content: string): Promise<Card> {
  const updated = { ...card, content, updatedAt: new Date().toISOString() };
  await getStorage().put(updated);
  return updated;
}

export async function removeCard(id: string): Promise<boolean> {
  return getStorage().remove(id);
}
