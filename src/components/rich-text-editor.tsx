"use client";

import dynamic from "next/dynamic";

/** O Tiptap depende do DOM; carregamos o editor apenas no navegador. */
export const RichTextEditor = dynamic(
  () => import("./tiptap-editor").then((m) => m.RichTextEditor),
  {
    ssr: false,
    loading: () => (
      <div className="h-60 animate-pulse rounded-xl border border-stone-300 bg-white dark:border-stone-700 dark:bg-stone-900" />
    ),
  },
);
