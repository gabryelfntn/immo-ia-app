/** Mois calendaires locaux (Europe) pour agrégations dashboard */

export type MonthBucket = {
  year: number;
  month: number; // 0-11
  key: string; // YYYY-MM
  label: string; // ex. "avr. 25"
};

export function formatMonthLabel(year: number, month: number): string {
  return new Intl.DateTimeFormat("fr-FR", {
    month: "short",
    year: "2-digit",
  }).format(new Date(year, month, 1));
}

export function lastNMonthBuckets(n: number): MonthBucket[] {
  const out: MonthBucket[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth();
    const key = `${year}-${String(month + 1).padStart(2, "0")}`;
    out.push({
      year,
      month,
      key,
      label: formatMonthLabel(year, month),
    });
  }
  return out;
}

export function isInLocalMonth(
  iso: string,
  year: number,
  month0: number
): boolean {
  const d = new Date(iso);
  return d.getFullYear() === year && d.getMonth() === month0;
}

/** Bornes du mois courant (local) en ISO pour requêtes Supabase .gte / .lte */
export function currentMonthRangeISO(): { start: string; end: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const start = new Date(y, m, 1, 0, 0, 0, 0);
  const end = new Date(y, m + 1, 0, 23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

export function previousMonthRangeISO(): { start: string; end: string } {
  const now = new Date();
  const y = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const m = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  const start = new Date(y, m, 1, 0, 0, 0, 0);
  const end = new Date(y, m + 1, 0, 23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}
