"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseMoney, priceFieldFor, todayText, formatMoney } from "@/lib/stok/format";
import { returnableQuantities, saleBalance } from "@/lib/stok/queries";
import {
  ActionState, StockError, audit, changeStock, formText, isDay, listValues, nextCode, parseJsonLines,
  rememberListValue, requireUserId, runAction, transaction,
} from "@/lib/stok/server";

const done = () => revalidatePath("/admin/stok", "layout");

// ===== Cariler =====

export async function saveCustomer(id: number | null, _prev: ActionState, form: FormData): Promise<ActionState> {
  let savedId = id;
  const result = await runAction(async () => {
    const userId = await requireUserId();
    const name = formText(form, "name");
    if (!name) throw new StockError("Cari adı / unvanı zorunludur.");
    const data = {
      name,
      type: formText(form, "type") || "Şahıs",
      phone: formText(form, "phone") || null,
      address: formText(form, "address") || null,
      email: formText(form, "email") || null,
      contactPerson: formText(form, "contactPerson") || null,
      notes: formText(form, "notes") || null,
    };
    savedId = await transaction(async (tx) => {
      await rememberListValue(tx, "Cari Türü", data.type);
      if (id) {
        const old = await tx.customer.findUnique({ where: { id } });
        if (!old) throw new StockError("Cari bulunamadı.");
        const updated = await tx.customer.update({ where: { id }, data });
        await audit(tx, "Cari", old.code, old, updated, userId);
        return id;
      }
      const code = await nextCode(tx, "CAR", false);
      return (await tx.customer.create({ data: { ...data, code } })).id;
    });
  });
  if (result?.error) return result;
  done();
  redirect(`/admin/stok/cariler/${savedId}`);
}

export async function toggleCustomer(id: number) {
  const userId = await requireUserId();
  await transaction(async (tx) => {
    const c = await tx.customer.findUniqueOrThrow({ where: { id } });
    await tx.customer.update({ where: { id }, data: { active: !c.active } });
    await audit(tx, "Cari Durum", c.code, c.active ? "Evet" : "Hayır", c.active ? "Hayır" : "Evet", userId);
  });
  done();
}

// ===== Satışlar =====

type SaleLineInput = { stockItemId: number; quantity: number; unitPrice: string };

export async function saveSale(id: number | null, _prev: ActionState, form: FormData): Promise<ActionState> {
  let savedId = id;
  const result = await runAction(async () => {
    const userId = await requireUserId();
    const customerId = Number(formText(form, "customerId"));
    const currency = formText(form, "currency").toUpperCase() || "TRY";
    const date = formText(form, "date") || todayText();
    const plate = formText(form, "plate") || null;
    const notes = formText(form, "notes") || null;
    if (!customerId) throw new StockError("Müşteri / cari seçin.");
    if (!isDay(date)) throw new StockError("Geçerli bir satış tarihi seçin.");
    if (!(await listValues("Para Birimi")).includes(currency)) throw new StockError("Geçerli bir para birimi seçin.");
    const firstPayment = id ? 0 : parseMoney(formText(form, "firstPayment")) ?? 0;
    if (firstPayment < 0) throw new StockError("İlk tahsilat negatif olamaz.");
    const method = formText(form, "method") || "Nakit";

    const rawLines = parseJsonLines<SaleLineInput>(form).filter((l) => Number(l.stockItemId) && Number(l.quantity) !== 0);
    if (!rawLines.length) throw new StockError("Satışa en az bir ürün ekleyin.");

    savedId = await transaction(async (tx) => {
      const customer = await tx.customer.findUnique({ where: { id: customerId } });
      if (!customer || !customer.active) throw new StockError("Aktif bir cari seçin.");

      const items = await tx.stockItem.findMany({ where: { id: { in: rawLines.map((l) => Number(l.stockItemId)) } } });
      const itemMap = new Map(items.map((i) => [i.id, i]));
      const priceField = priceFieldFor(currency);
      const seen = new Set<number>();
      const lines = rawLines.map((raw) => {
        const item = itemMap.get(Number(raw.stockItemId));
        const quantity = Number(raw.quantity);
        if (!item || !item.active) throw new StockError("Satıştaki ürünlerden biri bulunamadı veya pasif.");
        if (!Number.isInteger(quantity) || quantity < 0) throw new StockError("Satış adedi pozitif tam sayı olmalıdır.");
        if (seen.has(item.id)) throw new StockError(`${item.code} satışa birden fazla kez eklenmiş. Adetleri tek satırda birleştirin.`);
        seen.add(item.id);
        let unitPrice = parseMoney(raw.unitPrice);
        if (unitPrice === null) {
          unitPrice = priceField ? item[priceField] : null;
          if (unitPrice === null) throw new StockError(`${item.brand} ${item.model} için ${currency} fiyatı kayıtlı değil. Birim fiyatı satıra elle girin.`);
        }
        if (unitPrice < 0) throw new StockError("Satış fiyatı negatif olamaz.");
        return { stockItemId: item.id, name: item.name, quantity, unitPrice, lineTotal: quantity * unitPrice, item };
      });
      const total = lines.reduce((s, l) => s + l.lineTotal, 0);

      const old = id ? await tx.sale.findUnique({ where: { id }, include: { lines: true, returns: true } }) : null;
      if (id && (!old || old.cancelled)) throw new StockError("Satış bulunamadı.");
      const oldQty = new Map<number, number>();
      let prevPaid = 0;
      if (old) {
        if (old.returns.length) throw new StockError("İade kaydı bulunan satış değiştirilemez; gerekirse yeni bir iade işlemi yapın.");
        prevPaid = (await saleBalance(tx, old.id)).paid;
        if (prevPaid > 0 && (currency !== old.currency || customerId !== old.customerId)) {
          throw new StockError("Tahsilat yapılmış satışın carisi veya para birimi değiştirilemez.");
        }
        if (prevPaid > total) throw new StockError(`Bu satışa bağlı tahsilat (${formatMoney(prevPaid, currency)}) yeni toplamdan büyük olamaz.`);
        for (const l of old.lines) oldQty.set(l.stockItemId, (oldQty.get(l.stockItemId) ?? 0) + l.quantity);
      }
      for (const l of lines) {
        const available = l.item.quantity + (oldQty.get(l.stockItemId) ?? 0);
        if (available < l.quantity) {
          throw new StockError(`Yetersiz stok: ${l.item.brand} ${l.item.model} / ${l.item.name} (mevcut: ${available}, istenen: ${l.quantity}).`);
        }
      }

      let saleId: number, code: string;
      const lineData = lines.map((l) => ({ stockItemId: l.stockItemId, name: l.name, quantity: l.quantity, unitPrice: l.unitPrice, lineTotal: l.lineTotal }));
      if (old) {
        code = old.code;
        saleId = old.id;
        for (const l of old.lines) {
          await changeStock(tx, { stockItemId: l.stockItemId, delta: l.quantity, type: "Satış düzenleme geri alımı", ref: code, note: "Satış düzenlenmeden önce stok geri eklendi", userId });
        }
        await tx.saleLine.deleteMany({ where: { saleId } });
        await tx.sale.update({ where: { id: saleId }, data: { date, customerId, currency, total, plate, notes, lines: { create: lineData } } });
        await audit(tx, "Satış", code, old, { date, customerId, currency, total, plate, notes, lines: lineData }, userId);
      } else {
        code = await nextCode(tx, "SAT", true);
        saleId = (await tx.sale.create({ data: { code, date, customerId, currency, total, plate, notes, userId, lines: { create: lineData } } })).id;
      }
      for (const l of lines) {
        await changeStock(tx, { stockItemId: l.stockItemId, delta: -l.quantity, type: "Satış", ref: code, note: `Satış ${code}`, userId });
      }

      if (!old && firstPayment > 0) {
        if (firstPayment > total) throw new StockError("İlk tahsilat satış toplamını aşamaz.");
        const payCode = await nextCode(tx, "TAH", true);
        await tx.payment.create({
          data: {
            code: payCode, date, customerId, currency, amount: firstPayment, method, userId,
            note: `${code} satışında ilk tahsilat`, allocations: { create: [{ saleId, amount: firstPayment }] },
          },
        });
        await rememberListValue(tx, "Ödeme Yöntemi", method);
      }
      return saleId;
    });
  });
  if (result?.error) return result;
  done();
  redirect(`/admin/stok/satislar/${savedId}`);
}

export async function cancelSale(id: number): Promise<ActionState> {
  const result = await runAction(async () => {
    const userId = await requireUserId();
    await transaction(async (tx) => {
      const sale = await tx.sale.findUnique({ where: { id }, include: { lines: true } });
      if (!sale) throw new StockError("Satış bulunamadı.");
      if (sale.cancelled) throw new StockError("Satış zaten iptal edilmiş.");
      const balance = await saleBalance(tx, id);
      if (balance.paid > 0 || balance.returned > 0) {
        throw new StockError("Tahsilat veya iade kaydı bulunan satış doğrudan iptal edilemez. İade işlemini kullanın.");
      }
      for (const l of sale.lines) {
        await changeStock(tx, { stockItemId: l.stockItemId, delta: l.quantity, type: "Satış iptal iadesi", ref: sale.code, note: "Satış iptal edildi", userId });
      }
      await tx.sale.update({ where: { id }, data: { cancelled: true } });
      await audit(tx, "Satış iptali", sale.code, { cancelled: false }, { cancelled: true }, userId);
    });
  });
  if (result?.error) return result;
  done();
  redirect(`/admin/stok/satislar/${id}`);
}

export async function returnSale(id: number, _prev: ActionState, form: FormData): Promise<ActionState> {
  const result = await runAction(async () => {
    const userId = await requireUserId();
    const note = formText(form, "note") || null;
    return transaction(async (tx) => {
      const sale = await tx.sale.findUnique({ where: { id } });
      if (!sale || sale.cancelled) throw new StockError("Satış bulunamadı.");
      const rows = await returnableQuantities(tx, id);
      const lines = rows.flatMap((row) => {
        const quantity = Number(formText(form, `qty_${row.stockItemId}`) || 0);
        if (!quantity) return [];
        if (!Number.isInteger(quantity) || quantity < 0 || quantity > row.returnable) {
          throw new StockError(`${row.stockItem.code} için en fazla ${row.returnable} adet iade alınabilir.`);
        }
        return [{ stockItemId: row.stockItemId, quantity, unitPrice: row.unitPrice, lineTotal: quantity * row.unitPrice }];
      });
      if (!lines.length) throw new StockError("İade için en az bir ürün adedi girin.");
      const code = await nextCode(tx, "IAD", true);
      const total = lines.reduce((s, l) => s + l.lineTotal, 0);
      await tx.saleReturn.create({ data: { code, saleId: id, date: todayText(), currency: sale.currency, total, note, userId, lines: { create: lines } } });
      for (const l of lines) {
        await changeStock(tx, { stockItemId: l.stockItemId, delta: l.quantity, type: "Satış iadesi", ref: code, note: `${sale.code} satış iadesi`, userId });
      }
      await audit(tx, "Satış iadesi", code, {}, { sale: sale.code, lines, total }, userId);
      return `İade kaydedildi (${code}): ${formatMoney(total, sale.currency)}. İade tutarı satış bakiyesinden düşüldü.`;
    });
  });
  if (!result?.error) done();
  return result;
}

// ===== Tahsilatlar =====

type AllocationInput = { saleId: number; amount: string };

export async function createPayment(_prev: ActionState, form: FormData): Promise<ActionState> {
  let savedId = 0;
  const result = await runAction(async () => {
    const userId = await requireUserId();
    const customerId = Number(formText(form, "customerId"));
    const currency = formText(form, "currency").toUpperCase() || "TRY";
    const amount = parseMoney(formText(form, "amount")) ?? 0;
    const method = formText(form, "method") || "Nakit";
    const date = formText(form, "date") || todayText();
    const note = formText(form, "note") || null;
    if (!customerId) throw new StockError("Cari seçin.");
    if (amount <= 0) throw new StockError("Tahsilat tutarı sıfırdan büyük olmalıdır.");
    if (!isDay(date)) throw new StockError("Geçerli bir tarih seçin.");
    if (!(await listValues("Para Birimi")).includes(currency)) throw new StockError("Geçerli bir para birimi seçin.");
    const rawAllocations = parseJsonLines<AllocationInput>(form)
      .map((a) => ({ saleId: Number(a.saleId), amount: parseMoney(a.amount) ?? 0 }))
      .filter((a) => a.saleId && a.amount !== 0);

    savedId = await transaction(async (tx) => {
      const customer = await tx.customer.findUnique({ where: { id: customerId } });
      if (!customer || !customer.active) throw new StockError("Aktif bir cari seçin.");
      let allocated = 0;
      for (const a of rawAllocations) {
        const sale = await tx.sale.findUnique({ where: { id: a.saleId } });
        if (!sale || sale.cancelled || sale.customerId !== customerId) throw new StockError("Dağıtımda seçilen satış bu cariye ait değil.");
        if (sale.currency !== currency) throw new StockError("Tahsilat yalnızca aynı para birimindeki satışa bağlanabilir.");
        const { remaining } = await saleBalance(tx, sale.id);
        if (a.amount < 0 || a.amount > remaining) throw new StockError(`${sale.code} için kalan borç ${formatMoney(remaining, currency)}; fazla dağıtım yapılamaz.`);
        allocated += a.amount;
      }
      if (allocated > amount) throw new StockError("Satışlara dağıtılan tutar tahsilat toplamını aşamaz.");
      const code = await nextCode(tx, "TAH", true);
      const payment = await tx.payment.create({
        data: { code, date, customerId, currency, amount, method, note, userId, allocations: { create: rawAllocations } },
      });
      await rememberListValue(tx, "Ödeme Yöntemi", method);
      await audit(tx, "Tahsilat", code, {}, { customer: customer.code, currency, amount, allocations: rawAllocations }, userId);
      return payment.id;
    });
  });
  if (result?.error) return result;
  done();
  redirect(`/admin/stok/tahsilatlar/${savedId}/makbuz`);
}
