export const BASE_CURRENCIES = ["TRY", "EUR", "USD", "GBP"] as const;

export const PRICE_FIELDS = {
  TRY: "priceTry",
  EUR: "priceEur",
  USD: "priceUsd",
  GBP: "priceGbp",
} as const;

export type PriceField = (typeof PRICE_FIELDS)[keyof typeof PRICE_FIELDS];

export function priceFieldFor(currency: string): PriceField | null {
  return (PRICE_FIELDS as Record<string, PriceField>)[currency] ?? null;
}

/** "1.250,50" / "1250.5" / "1250,5" → 125050 (kuruş). Boş metin → null. */
export function parseMoney(input: unknown): number | null {
  if (input === null || input === undefined) return null;
  let text = String(input).trim().replace(/\s/g, "");
  if (!text) return null;
  if (text.includes(",") && text.includes(".")) {
    text = text.lastIndexOf(",") > text.lastIndexOf(".")
      ? text.replace(/\./g, "").replace(",", ".")
      : text.replace(/,/g, "");
  } else if (text.includes(",")) {
    text = text.replace(",", ".");
  }
  const value = Number(text);
  if (!Number.isFinite(value)) throw new Error("Geçerli bir tutar girin.");
  return Math.round(value * 100);
}

export function centsToInput(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "";
  return (cents / 100).toFixed(2).replace(/\.00$/, "");
}

export function formatMoney(cents: number | null | undefined, currency?: string): string {
  const value = (cents ?? 0) / 100;
  const text = value.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return currency ? `${text} ${currency}` : text;
}

export function todayText(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function formatDay(day: string | null | undefined): string {
  if (!day) return "—";
  const [y, m, d] = day.slice(0, 10).split("-");
  return d && m && y ? `${d}.${m}.${y}` : day;
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("tr-TR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export function sumByCurrency(rows: { currency: string; amount: number }[]): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const row of rows) totals[row.currency] = (totals[row.currency] ?? 0) + row.amount;
  return totals;
}
