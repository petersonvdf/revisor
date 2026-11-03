"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { createCard } from "@/app/actions";
import { RichTextEditor } from "./rich-text-editor";

export function NewCardForm() {
  const [content, setContent] = useState("");
  const [resetKey, setResetKey] = useState(0);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    setMessage(null);
    startTransition(async () => {
      const res = await createCard(content);
      if (res.ok) {
        setResetKey((k) => k + 1);
        setMessage({ type: "ok", text: "Card salvo! Ele já está disponível na revisão de hoje." });
      } else {
        setMessage({ type: "error", text: res.error });
      }
    });
  }

  return (
    <div className="space-y-4">
      <RichTextEditor onChange={setContent} resetKey={resetKey} autoFocus />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="status" className="text-sm">
          {message && (
            <span className={message.type === "ok" ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}>
              {message.text}{" "}
              {message.type === "ok" && (
                <Link href="/" className="font-medium underline underline-offset-2">
                  Ir para a revisão
                </Link>
              )}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="rounded-lg bg-amber-500 px-5 py-2.5 font-semibold text-stone-950 shadow-sm hover:bg-amber-400 disabled:opacity-60"
        >
          {pending ? "Salvando…" : "Salvar card"}
        </button>
      </div>
    </div>
  );
}
