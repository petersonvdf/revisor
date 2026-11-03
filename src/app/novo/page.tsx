import type { Metadata } from "next";
import { NewCardForm } from "@/components/new-card-form";

export const metadata: Metadata = { title: "Novo card · Revisor" };

export default function NewCardPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Novo card</h1>
      <p className="mb-6 mt-1 text-sm text-stone-600 dark:text-stone-400">
        O card entra na revisão de hoje. Depois volta em 1, 7, 16 e 35 dias, e a partir daí o
        intervalo dobra a cada revisão.
      </p>
      <NewCardForm />
    </>
  );
}
