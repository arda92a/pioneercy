import { prisma } from "@/lib/prisma";
import type { Tx } from "@/lib/stok/server";

type Db = Tx | typeof prisma;

export type CurrencyTotals = Record<string, number>;

export function addTo(totals: CurrencyTotals, currency: string, amount: number) {
  totals[currency] = (totals[currency] ?? 0) + amount;
}

export function nonZero(totals: CurrencyTotals): [string, number][] {
  return Object.entries(totals).filter(([, v]) => v !== 0).sort(([a], [b]) => a.localeCompare(b));
}

/** Satışın iade, tahsilat ve kalan tutarı. */
export async function saleBalance(db: Db, saleId: number) {
  const [sale, returned, paid] = await Promise.all([
    db.sale.findUniqueOrThrow({ where: { id: saleId }, select: { total: true } }),
    db.saleReturn.aggregate({ where: { saleId }, _sum: { total: true } }),
    db.paymentAllocation.aggregate({ where: { saleId }, _sum: { amount: true } }),
  ]);
  const returnedTotal = returned._sum.total ?? 0;
  const paidTotal = paid._sum.amount ?? 0;
  return { total: sale.total, returned: returnedTotal, paid: paidTotal, remaining: sale.total - returnedTotal - paidTotal };
}

/** Birden çok satış için iade/tahsilat/kalan tutarları tek seferde hesaplar. */
export async function saleBalances(db: Db, saleIds: number[]) {
  const [returns, allocations] = await Promise.all([
    db.saleReturn.groupBy({ by: ["saleId"], where: { saleId: { in: saleIds } }, _sum: { total: true } }),
    db.paymentAllocation.groupBy({ by: ["saleId"], where: { saleId: { in: saleIds } }, _sum: { amount: true } }),
  ]);
  const returned = new Map(returns.map((r) => [r.saleId, r._sum.total ?? 0]));
  const paid = new Map(allocations.map((a) => [a.saleId, a._sum.amount ?? 0]));
  return (saleId: number, total: number) => {
    const r = returned.get(saleId) ?? 0;
    const p = paid.get(saleId) ?? 0;
    return { returned: r, paid: p, remaining: total - r - p };
  };
}

/** Cari bakiyeleri: satış − iade − tahsilat, para birimi bazında. */
export async function customerBalances(db: Db, customerId?: number) {
  const where = customerId ? { customerId } : {};
  const [sales, returns, payments] = await Promise.all([
    db.sale.groupBy({ by: ["customerId", "currency"], where: { ...where, cancelled: false }, _sum: { total: true } }),
    db.saleReturn.findMany({
      where: { sale: { cancelled: false, ...(customerId ? { customerId } : {}) } },
      select: { total: true, currency: true, sale: { select: { customerId: true } } },
    }),
    db.payment.groupBy({ by: ["customerId", "currency"], where, _sum: { amount: true } }),
  ]);
  const result = new Map<number, CurrencyTotals>();
  const bucket = (id: number) => {
    if (!result.has(id)) result.set(id, {});
    return result.get(id)!;
  };
  for (const s of sales) addTo(bucket(s.customerId), s.currency, s._sum.total ?? 0);
  for (const r of returns) addTo(bucket(r.sale.customerId), r.currency, -r.total);
  for (const p of payments) addTo(bucket(p.customerId), p.currency, -(p._sum.amount ?? 0));
  return result;
}

/** Bir satıştan her ürün için daha ne kadar iade alınabileceği. */
export async function returnableQuantities(db: Db, saleId: number) {
  const [lines, returned] = await Promise.all([
    db.saleLine.findMany({ where: { saleId }, include: { stockItem: true } }),
    db.saleReturnLine.groupBy({ by: ["stockItemId"], where: { saleReturn: { saleId } }, _sum: { quantity: true } }),
  ]);
  const returnedMap = new Map(returned.map((r) => [r.stockItemId, r._sum.quantity ?? 0]));
  return lines.map((line) => {
    const alreadyReturned = returnedMap.get(line.stockItemId) ?? 0;
    return { ...line, alreadyReturned, returnable: line.quantity - alreadyReturned };
  });
}

export async function pickerItems(db: Db, opts: { includeIds?: number[] } = {}) {
  const items = await db.stockItem.findMany({
    where: { OR: [{ active: true }, { id: { in: opts.includeIds ?? [] } }] },
    orderBy: [{ brand: "asc" }, { model: "asc" }],
  });
  return items.map((i) => ({
    id: i.id, code: i.code, brand: i.brand, model: i.model, name: i.name, quantity: i.quantity,
    prices: { TRY: i.priceTry, EUR: i.priceEur, USD: i.priceUsd, GBP: i.priceGbp },
  }));
}

export async function companyInfo(db: Db) {
  const rows = await db.stockSetting.findMany({ where: { key: { in: ["sirket_adi", "logo_yolu"] } } });
  const get = (k: string) => rows.find((r) => r.key === k)?.value ?? "";
  return { name: get("sirket_adi") || "D.S. Electronics", logo: get("logo_yolu") };
}

export function stockLabel(item: { code: string; brand: string; model: string; name: string }) {
  return `${item.code} — ${item.brand} ${item.model}`.trim() + ` / ${item.name}`;
}
