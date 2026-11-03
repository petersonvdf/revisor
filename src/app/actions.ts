"use server";

import { revalidatePath } from "next/cache";
import {
  getCard,
  insertCard,
  markReviewed,
  removeCard,
  updateCardContent,
  type Card,
} from "@/lib/db";
import { hasText, sanitizeContent } from "@/lib/sanitize";
import { isDue } from "@/lib/schedule";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const MAX_LENGTH = 200_000;

function parseContent(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.length > MAX_LENGTH) return null;
  const clean = sanitizeContent(raw);
  return hasText(clean) ? clean : null;
}

/** Edição/exclusão só são permitidas para cards disponíveis para revisão hoje. */
async function getDueCard(id: unknown): Promise<Card | null> {
  if (typeof id !== "string") return null;
  const card = await getCard(id);
  return card && isDue(card.nextReviewDate) ? card : null;
}

export async function createCard(content: string): Promise<ActionResult<Card>> {
  const clean = parseContent(content);
  if (!clean) return { ok: false, error: "Digite algum texto antes de salvar." };
  const card = await insertCard(clean);
  revalidatePath("/");
  return { ok: true, data: card };
}

export async function completeReview(id: string): Promise<ActionResult<Card>> {
  const card = await getDueCard(id);
  if (!card) {
    return { ok: false, error: "Este card não está disponível para revisão hoje." };
  }
  return { ok: true, data: await markReviewed(card) };
}

export async function editCard(id: string, content: string): Promise<ActionResult<Card>> {
  const card = await getDueCard(id);
  if (!card) {
    return { ok: false, error: "Só é possível editar cards da revisão de hoje." };
  }
  const clean = parseContent(content);
  if (!clean) return { ok: false, error: "O card não pode ficar vazio." };
  return { ok: true, data: await updateCardContent(card, clean) };
}

export async function deleteCard(id: string): Promise<ActionResult> {
  if (!(await getDueCard(id))) {
    return { ok: false, error: "Só é possível excluir cards da revisão de hoje." };
  }
  await removeCard(id);
  return { ok: true, data: undefined };
}
