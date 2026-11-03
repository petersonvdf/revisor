"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { Card } from "@/lib/db";
import { completeReview, deleteCard, editCard } from "@/app/actions";
import { formatDate, intervalAfterReview } from "@/lib/schedule";
import { RichTextEditor } from "./rich-text-editor";

type Mode = "view" | "edit" | "confirm-delete";

export function ReviewSession({ cards }: { cards: Card[] }) {
  const [queue, setQueue] = useState(cards);
  const [total] = useState(cards.length);
  const [mode, setMode] = useState<Mode>("view");
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const current = queue[0];
  const done = total - queue.length;

  function next(message: string) {
    setQueue((q) => q.slice(1));
    setMode("view");
    setError(null);
    setNotice(message);
  }

  function run<T>(action: () => Promise<{ ok: true; data: T } | { ok: false; error: string }>, onOk: (data: T) => void) {
    setError(null);
    startTransition(async () => {
      const res = await action();
      if (res.ok) onOk(res.data);
      else setError(res.error);
    });
  }

  if (!current) {
    return (
      <div className="fade-in mx-auto max-w-xl rounded-2xl border border-emerald-200 bg-emerald-50 p-10 text-center dark:border-emerald-900 dark:bg-emerald-950/40">
        <p className="text-5xl" aria-hidden>🎉</p>
        <h2 className="mt-4 text-2xl font-semibold text-emerald-900 dark:text-emerald-100">
          Todas as revisões de hoje foram feitas!
        </h2>
        <p className="mt-2 text-emerald-800/80 dark:text-emerald-200/70">
          {total > 0
            ? `Você revisou ${total} ${total === 1 ? "card" : "cards"} hoje. Volte amanhã.`
            : "Não há cards para revisar hoje."}
        </p>
        {notice && <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-300">{notice}</p>}
        <Link
          href="/novo"
          className="mt-6 inline-block rounded-lg bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800"
        >
          Criar novo card
        </Link>
      </div>
    );
  }

  const nextInterval = intervalAfterReview(current.reviewCount + 1);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between gap-4 text-sm text-stone-600 dark:text-stone-400">
        <span>
          <strong className="text-stone-900 dark:text-stone-100">{queue.length}</strong>{" "}
          {queue.length === 1 ? "card restante" : "cards restantes"}
        </span>
        <span>
          {done} de {total} revisados
        </span>
      </div>
      <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
        <div
          className="h-full rounded-full bg-amber-500 transition-all duration-500"
          style={{ width: `${total ? (done / total) * 100 : 0}%` }}
        />
      </div>

      {notice && mode === "view" && (
        <p role="status" className="mb-4 rounded-lg bg-stone-100 px-4 py-2 text-sm text-stone-700 dark:bg-stone-800 dark:text-stone-300">
          {notice}
        </p>
      )}

      <article
        key={current.id}
        className="fade-in rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-stone-800 dark:bg-stone-900"
      >
        <header className="flex flex-wrap gap-x-6 gap-y-1 border-b border-stone-100 px-6 py-3 text-xs text-stone-500 dark:border-stone-800 dark:text-stone-400">
          <span>Criado em {formatDate(current.createdOn)}</span>
          <span>
            {current.reviewCount === 0 ? "Primeira revisão" : `${current.reviewCount + 1}ª revisão`}
          </span>
        </header>

        {mode === "edit" ? (
          <div className="p-4">
            <RichTextEditor initialContent={current.content} onChange={setDraft} autoFocus />
          </div>
        ) : (
          <div
            className="rich-content min-h-40 px-6 py-6"
            dangerouslySetInnerHTML={{ __html: current.content }}
          />
        )}

        {error && (
          <p role="alert" className="mx-6 mb-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">
            {error}
          </p>
        )}

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 px-6 py-4 dark:border-stone-800">
          {mode === "view" && (
            <>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setDraft(current.content); setMode("edit"); setError(null); }}
                  className="rounded-lg border border-stone-300 px-3 py-2 text-sm hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => { setMode("confirm-delete"); setError(null); }}
                  className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
                >
                  Excluir
                </button>
              </div>
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  run(() => completeReview(current.id), (card) =>
                    next(`Revisão registrada. Esse card volta em ${formatDate(card.nextReviewDate)}.`),
                  )
                }
                title={`Próxima revisão em ${nextInterval} ${nextInterval === 1 ? "dia" : "dias"}`}
                className="rounded-lg bg-amber-500 px-5 py-2.5 font-semibold text-stone-950 shadow-sm hover:bg-amber-400 disabled:opacity-60"
              >
                {pending ? "Salvando…" : "✓ Revisão concluída"}
              </button>
            </>
          )}

          {mode === "edit" && (
            <div className="ml-auto flex gap-2">
              <button
                type="button"
                onClick={() => { setMode("view"); setError(null); }}
                className="rounded-lg border border-stone-300 px-3 py-2 text-sm hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  run(() => editCard(current.id, draft), (card) => {
                    setQueue((q) => [card, ...q.slice(1)]);
                    setMode("view");
                    setNotice("Card atualizado.");
                  })
                }
                className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-60 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-300"
              >
                {pending ? "Salvando…" : "Salvar alterações"}
              </button>
            </div>
          )}

          {mode === "confirm-delete" && (
            <div className="flex w-full flex-wrap items-center justify-between gap-3">
              <span className="text-sm text-red-700 dark:text-red-400">
                Excluir este card definitivamente?
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode("view")}
                  className="rounded-lg border border-stone-300 px-3 py-2 text-sm hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(() => deleteCard(current.id), () => next("Card excluído."))}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {pending ? "Excluindo…" : "Sim, excluir"}
                </button>
              </div>
            </div>
          )}
        </footer>
      </article>
    </div>
  );
}
