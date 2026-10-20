"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseMoney, todayText } from "@/lib/stok/format";
import {
  ActionState, ConfirmError, StockError, audit, changeStock, formInt, formText, isDay, nextCode,
  parseJsonLines, rememberListValue, requireUserId, runAction, transaction, dayToDate,
} from "@/lib/stok/server";

const done = () => revalidatePath("/admin/stok", "layout");

type Fit = { brand: string; model: string; yearFrom: number | null; yearTo: number | null };

function parseFits(textValue: string): Fit[] {
  const fits: Fit[] = [];
  for (const raw of textValue.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const parts = line.split("|").map((p) => p.trim());
    if (parts.length < 2) throw new StockError("Araç uyumluluğu her satırda şu biçimde olmalı: Marka | Model | Başlangıç yılı | Bitiş yılı");
    const year = (v?: string) => {
      if (!v) return null;
      const n = Number(v);
      if (!Number.isInteger(n)) throw new StockError(`Geçersiz yıl: ${v}`);
      return n;
    };
    const yearFrom = year(parts[2]), yearTo = year(parts[3]);
    if (yearFrom && yearTo && yearFrom > yearTo) throw new StockError("Araç uyumluluğunda başlangıç yılı bitiş yılından büyük olamaz.");
    fits.push({ brand: parts[0], model: parts[1], yearFrom, yearTo });
  }
  return fits;
}

function priceFrom(form: FormData, key: string) {
  const value = parseMoney(formText(form, key));
  if (value !== null && value < 0) throw new StockError("Satış fiyatı negatif olamaz.");
  return value;
}

export async function saveStockItem(id: number | null, _prev: ActionState, form: FormData): Promise<ActionState> {
  let savedId = id;
  const result = await runAction(async () => {
    const userId = await requireUserId();
    const category = formText(form, "category");
    const brand = formText(form, "brand");
    const model = formText(form, "model");
    const name = formText(form, "name");
    if (!category || !brand || !name) throw new StockError("Kategori, marka ve ürün adı zorunludur.");
    const minQuantity = formInt(form, "minQuantity");
    if (minQuantity < 0) throw new StockError("Minimum stok sıfırdan küçük olamaz.");
    const data = {
      category, brand, model, name, minQuantity,
      priceTry: priceFrom(form, "priceTry"), priceEur: priceFrom(form, "priceEur"),
      priceUsd: priceFrom(form, "priceUsd"), priceGbp: priceFrom(form, "priceGbp"),
    };
    const fits = parseFits(formText(form, "fits"));

    savedId = await transaction(async (tx) => {
      if (formText(form, "confirmDuplicate") !== "yes") {
        const candidates = await tx.stockItem.findMany({ where: { active: true, ...(id ? { id: { not: id } } : {}) } });
        const key = (s: string) => s.toLocaleLowerCase("tr");
        const dup = candidates.find((p) => key(p.brand) === key(brand) && key(p.model) === key(model) && key(p.name) === key(name));
        if (dup) throw new ConfirmError(`Benzer bir stok kartı zaten var: ${dup.code} — ${dup.brand} ${dup.model} / ${dup.name}. Yine de kaydetmek için tekrar onaylayın.`);
      }
      let itemId: number;
      if (id) {
        const old = await tx.stockItem.findUnique({ where: { id }, include: { fits: true } });
        if (!old) throw new StockError("Stok kartı bulunamadı.");
        const updated = await tx.stockItem.update({ where: { id }, data });
        await tx.vehicleFit.deleteMany({ where: { stockItemId: id } });
        await audit(tx, "Stok", old.code, old, { ...updated, fits }, userId);
        itemId = id;
      } else {
        const code = await nextCode(tx, "STK", false);
        itemId = (await tx.stockItem.create({ data: { ...data, code } })).id;
      }
      if (fits.length) await tx.vehicleFit.createMany({ data: fits.map((f) => ({ ...f, stockItemId: itemId })) });
      await rememberListValue(tx, "Ürün Kategorisi", category);
      await rememberListValue(tx, "Ürün Markası", brand);
      await rememberListValue(tx, "Ürün Modeli", model);
      return itemId;
    });
  });
  if (result?.error) return result;
  done();
  redirect(`/admin/stok/kartlar/${savedId}?kaydedildi=1`);
}

export async function toggleStockItem(id: number) {
  const userId = await requireUserId();
  await transaction(async (tx) => {
    const item = await tx.stockItem.findUniqueOrThrow({ where: { id } });
    await tx.stockItem.update({ where: { id }, data: { active: !item.active } });
    await audit(tx, "Stok Durum", item.code, item.active ? "Evet" : "Hayır", item.active ? "Hayır" : "Evet", userId);
  });
  done();
}

export async function adjustStock(id: number, _prev: ActionState, form: FormData): Promise<ActionState> {
  const result = await runAction(async () => {
    const userId = await requireUserId();
    const newQuantity = formInt(form, "newQuantity", NaN);
    const reason = formText(form, "reason");
    if (!Number.isInteger(newQuantity)) throw new StockError("Yeni stok miktarını girin.");
    if (newQuantity < 0) throw new StockError("Stok miktarı negatif olamaz.");
    if (!reason) throw new StockError("Manuel stok düzeltme nedeni zorunludur.");
    return transaction(async (tx) => {
      const item = await tx.stockItem.findUnique({ where: { id } });
      if (!item) throw new StockError("Stok kartı bulunamadı.");
      const difference = newQuantity - item.quantity;
      if (difference === 0) throw new StockError("Yeni miktar mevcut stokla aynı; düzeltme gerekmiyor.");
      const code = await nextCode(tx, "DZT", true);
      await tx.stockAdjustment.create({
        data: { code, date: todayText(), stockItemId: id, oldQuantity: item.quantity, newQuantity, difference, reason, userId },
      });
      await changeStock(tx, { stockItemId: id, delta: difference, type: "Manuel düzeltme", ref: code, note: reason, userId });
      await audit(tx, "Stok miktarı", item.code, item.quantity, newQuantity, userId);
      return `Stok düzeltildi (${code}): ${item.quantity} → ${newQuantity}`;
    });
  });
  if (!result?.error) done();
  return result;
}

type ReceiptLineInput = { stockItemId: number; quantity: number; note?: string };

function receiptLines(form: FormData) {
  const lines = parseJsonLines<ReceiptLineInput>(form)
    .map((l) => ({ stockItemId: Number(l.stockItemId), quantity: Number(l.quantity), note: String(l.note ?? "").trim() }))
    .filter((l) => l.stockItemId && l.quantity !== 0);
  for (const l of lines) {
    if (!Number.isInteger(l.quantity) || l.quantity < 0) throw new StockError("Stok giriş adedi pozitif tam sayı olmalıdır.");
  }
  if (!lines.length) throw new StockError("En az bir ürün ve adet girmelisiniz.");
  return lines;
}

export async function saveStockReceipt(id: number | null, _prev: ActionState, form: FormData): Promise<ActionState> {
  let savedId = id;
  const result = await runAction(async () => {
    const userId = await requireUserId();
    const date = formText(form, "date") || todayText();
    if (!isDay(date)) throw new StockError("Geçerli bir tarih seçin.");
    const note = formText(form, "note") || null;
    const lines = receiptLines(form);

    savedId = await transaction(async (tx) => {
      const items = await tx.stockItem.findMany({ where: { id: { in: lines.map((l) => l.stockItemId) } } });
      const itemMap = new Map(items.map((i) => [i.id, i]));

      if (!id) {
        for (const l of lines) {
          const item = itemMap.get(l.stockItemId);
          if (!item || !item.active) throw new StockError(`Ürün bulunamadı veya pasif: ${item?.code ?? l.stockItemId}`);
        }
        const code = await nextCode(tx, "GIR", true);
        const receipt = await tx.stockReceipt.create({ data: { code, date, note, userId, lines: { create: lines.map((l) => ({ ...l, note: l.note || null })) } } });
        for (const l of lines) {
          await changeStock(tx, { stockItemId: l.stockItemId, delta: l.quantity, type: "Stok girişi", ref: code, note: l.note || note, userId, date: dayToDate(date) });
        }
        return receipt.id;
      }

      const receipt = await tx.stockReceipt.findUnique({ where: { id }, include: { lines: true } });
      if (!receipt) throw new StockError("Stok giriş fişi bulunamadı.");
      const oldBy = new Map<number, number>(), newBy = new Map<number, number>();
      for (const l of receipt.lines) oldBy.set(l.stockItemId, (oldBy.get(l.stockItemId) ?? 0) + l.quantity);
      for (const l of lines) {
        if (!itemMap.has(l.stockItemId)) throw new StockError("Stok kartı bulunamadı.");
        newBy.set(l.stockItemId, (newBy.get(l.stockItemId) ?? 0) + l.quantity);
      }
      const affected = await tx.stockItem.findMany({ where: { id: { in: [...new Set([...oldBy.keys(), ...newBy.keys()])] } } });
      for (const item of affected) {
        const diff = (newBy.get(item.id) ?? 0) - (oldBy.get(item.id) ?? 0);
        if (item.quantity + diff < 0) {
          throw new StockError(`${item.code} girişini bu şekilde azaltmak stoğu negatife düşürür (mevcut: ${item.quantity}). Önce stok hareketlerini kontrol edin.`);
        }
      }
      for (const item of affected) {
        const diff = (newBy.get(item.id) ?? 0) - (oldBy.get(item.id) ?? 0);
        await changeStock(tx, { stockItemId: item.id, delta: diff, type: "Stok giriş düzenleme farkı", ref: receipt.code, note: "Stok giriş fişi düzenlendi", userId, date: dayToDate(date) });
      }
      await tx.stockReceiptLine.deleteMany({ where: { receiptId: id } });
      await tx.stockReceipt.update({
        where: { id },
        data: { date, note, lines: { create: lines.map((l) => ({ ...l, note: l.note || null })) } },
      });
      await audit(tx, "Stok giriş fişi", receipt.code, receipt, { date, note, lines }, userId);
      return id;
    });
  });
  if (result?.error) return result;
  done();
  redirect(`/admin/stok/girisler/${savedId}/fis`);
}
