import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma/client";
import { todayText } from "@/lib/stok/format";

export type Tx = Prisma.TransactionClient;

/** Kullanıcıya gösterilecek iş kuralı hatası. */
export class StockError extends Error {}

export type ActionState = { error?: string; ok?: string; needsConfirm?: boolean } | undefined;

/** Kullanıcı onayı gerektiren uyarı (ör. benzer stok kartı). */
export class ConfirmError extends StockError {}

export async function requireUserId(): Promise<number> {
  const session = await getServerSession(authOptions);
  const id = Number((session?.user as { id?: string } | undefined)?.id);
  if (!session || !Number.isInteger(id)) throw new StockError("Oturumunuz kapanmış. Lütfen tekrar giriş yapın.");
  return id;
}

/** Server Action gövdesini çalıştırır; iş kuralı hatalarını forma mesaj olarak döndürür. */
export async function runAction(fn: () => Promise<string | void>): Promise<ActionState> {
  try {
    const ok = await fn();
    return ok ? { ok } : undefined;
  } catch (err) {
    if (err instanceof ConfirmError) return { error: err.message, needsConfirm: true };
    if (err instanceof StockError) return { error: err.message };
    throw err;
  }
}

export function parseJsonLines<T>(form: FormData, key = "lines"): T[] {
  try {
    const value = JSON.parse(formText(form, key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    throw new StockError("Form satırları okunamadı. Sayfayı yenileyip tekrar deneyin.");
  }
}

export function dayToDate(day: string): Date {
  return day === todayText() ? new Date() : new Date(`${day}T12:00:00`);
}

export function transaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  return prisma.$transaction(fn, { timeout: 20000 });
}

type CodeTable = "stockItem" | "customer" | "sale" | "payment" | "stockReceipt" | "stockAdjustment" | "saleReturn";

const PREFIX_TABLE: Record<string, CodeTable> = {
  STK: "stockItem",
  CAR: "customer",
  SAT: "sale",
  TAH: "payment",
  GIR: "stockReceipt",
  DZT: "stockAdjustment",
  IAD: "saleReturn",
};

/**
 * STK-0001 / SAT-2026-0001 biçiminde sıradaki numarayı verir. Sayaç ayarlarda
 * saklandığından silinen kayıtların numarası tekrar kullanılmaz.
 */
export async function nextCode(tx: Tx, prefix: keyof typeof PREFIX_TABLE, yearly: boolean): Promise<string> {
  const year = new Date().getFullYear();
  const marker = yearly ? `${prefix}-${year}-` : `${prefix}-`;
  const seqKey = yearly ? `sequence_${prefix}_${year}` : `sequence_${prefix}`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const table = (tx as any)[PREFIX_TABLE[prefix]];
  const last: { code: string } | null = await table.findFirst({
    where: { code: { startsWith: marker } },
    orderBy: { code: "desc" },
    select: { code: true },
  });
  const highest = last ? Number(last.code.slice(marker.length)) || 0 : 0;
  const saved = Number((await tx.stockSetting.findUnique({ where: { key: seqKey } }))?.value ?? 1) || 1;
  const sequence = Math.max(highest + 1, saved);

  await tx.stockSetting.upsert({
    where: { key: seqKey },
    create: { key: seqKey, value: String(sequence + 1) },
    update: { value: String(sequence + 1) },
  });
  return `${marker}${String(sequence).padStart(4, "0")}`;
}

export async function changeStock(
  tx: Tx,
  args: { stockItemId: number; delta: number; type: string; ref: string; note?: string | null; userId: number; date?: Date },
) {
  if (args.delta === 0) return;
  await tx.stockItem.update({ where: { id: args.stockItemId }, data: { quantity: { increment: args.delta } } });
  await tx.stockMovement.create({
    data: {
      type: args.type, ref: args.ref, stockItemId: args.stockItemId, quantity: args.delta,
      note: args.note || null, userId: args.userId, ...(args.date ? { date: args.date } : {}),
    },
  });
}

export async function audit(tx: Tx, kind: string, ref: string, oldValue: unknown, newValue: unknown, userId: number) {
  await tx.auditLog.create({
    data: {
      kind, ref, userId,
      oldValue: oldValue === undefined ? null : JSON.stringify(oldValue),
      newValue: newValue === undefined ? null : JSON.stringify(newValue),
    },
  });
}

export const LIST_DEFAULTS: Record<string, string[]> = {
  "Para Birimi": ["TRY", "EUR", "USD", "GBP"],
  "Ödeme Yöntemi": ["Nakit", "Banka Havalesi/EFT", "Kredi/Banka Kartı", "Diğer"],
  "Ürün Kategorisi": ["Oto Teybi", "Teyp Çerçevesi", "Araç Kamerası", "Araç Ekipmanı/Aksesuar"],
  "Cari Türü": ["Şahıs", "Firma"],
};

export async function listValues(group: string): Promise<string[]> {
  const rows = await prisma.stockListValue.findMany({ where: { group, active: true }, select: { value: true } });
  const values = rows.length ? rows.map((r) => r.value) : LIST_DEFAULTS[group] ?? [];
  return [...new Set(values)].sort((a, b) => a.localeCompare(b, "tr"));
}

export async function rememberListValue(tx: Tx, group: string, value: string | null | undefined) {
  const clean = (value ?? "").trim();
  if (!clean) return;
  const existing = await tx.stockListValue.findMany({ where: { group }, select: { value: true } });
  if (existing.some((e) => e.value.toLocaleLowerCase("tr") === clean.toLocaleLowerCase("tr"))) return;
  await tx.stockListValue.create({ data: { group, value: clean } });
}

export async function getSetting(key: string, fallback = ""): Promise<string> {
  return (await prisma.stockSetting.findUnique({ where: { key } }))?.value ?? fallback;
}

export function formText(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function formInt(form: FormData, key: string, fallback = 0): number {
  const text = formText(form, key);
  if (!text) return fallback;
  const value = Number(text);
  if (!Number.isInteger(value)) throw new StockError("Geçerli bir adet girin.");
  return value;
}

export function isDay(text: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(text);
}
