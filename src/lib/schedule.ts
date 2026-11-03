/**
 * Estratégia de revisão espaçada baseada no SuperMemo SM-0 (Piotr Wozniak),
 * derivada da curva do esquecimento de Ebbinghaus:
 *
 *   1ª revisão concluída → próxima em 1 dia
 *   2ª revisão concluída → próxima em 7 dias
 *   3ª revisão concluída → próxima em 16 dias
 *   4ª revisão concluída → próxima em 35 dias
 *   a partir daí        → o intervalo anterior × 2 (70, 140, 280, 560...)
 *
 * Um card recém-criado já fica disponível para revisão no mesmo dia.
 */
export const BASE_INTERVALS = [1, 7, 16, 35] as const;

/** Intervalo em dias após a N-ésima revisão concluída (N começa em 1). */
export function intervalAfterReview(reviewNumber: number): number {
  if (reviewNumber < 1) return 0;
  if (reviewNumber <= BASE_INTERVALS.length) {
    return BASE_INTERVALS[reviewNumber - 1];
  }
  const extra = reviewNumber - BASE_INTERVALS.length;
  return BASE_INTERVALS[BASE_INTERVALS.length - 1] * 2 ** extra;
}

/** Fuso usado para definir o que é "hoje". Configurável via APP_TIMEZONE. */
export const TIMEZONE = process.env.APP_TIMEZONE ?? "America/Sao_Paulo";

/** Data de hoje (YYYY-MM-DD) no fuso da aplicação. */
export function today(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Soma dias a uma data YYYY-MM-DD. */
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Um card está disponível se a data de revisão é hoje ou já passou. */
export function isDue(nextReviewDate: string, ref: string = today()): boolean {
  return nextReviewDate <= ref;
}

export function formatDate(date: string): string {
  const [y, m, d] = date.split("-");
  return `${d}/${m}/${y}`;
}
