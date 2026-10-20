"use server";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import ExcelJS from "exceljs";
import { parseMoney } from "@/lib/stok/format";
import {
  ActionState, StockError, changeStock, formText, nextCode, rememberListValue, requireUserId, runAction, transaction,
} from "@/lib/stok/server";

const done = () => revalidatePath("/admin/stok", "layout");

export async function saveSettings(_prev: ActionState, form: FormData): Promise<ActionState> {
  const result = await runAction(async () => {
    await requireUserId();
    const company = formText(form, "companyName");
    let logoPath: string | null = null;
    const logo = form.get("logo");
    if (logo instanceof File && logo.size > 0) {
      const ext = path.extname(logo.name).toLowerCase();
      if (![".png", ".jpg", ".jpeg", ".webp"].includes(ext)) throw new StockError("Logo PNG, JPG veya WEBP olmalıdır.");
      if (logo.size > 2 * 1024 * 1024) throw new StockError("Logo 2 MB'dan küçük olmalıdır.");
      const dir = path.join(process.cwd(), "public", "uploads");
      await mkdir(dir, { recursive: true });
      const name = `stok-logo-${Date.now()}${ext}`;
      await writeFile(path.join(dir, name), Buffer.from(await logo.arrayBuffer()));
      logoPath = `/uploads/${name}`;
    }
    await transaction(async (tx) => {
      const set = (key: string, value: string) => tx.stockSetting.upsert({ where: { key }, create: { key, value }, update: { value } });
      await set("sirket_adi", company);
      if (logoPath) await set("logo_yolu", logoPath);
      await rememberListValue(tx, "Para Birimi", formText(form, "newCurrency").toUpperCase());
      await rememberListValue(tx, "Ödeme Yöntemi", formText(form, "newMethod"));
      await rememberListValue(tx, "Ürün Kategorisi", formText(form, "newCategory"));
    });
    return "Ayarlar kaydedildi.";
  });
  if (!result?.error) done();
  return result;
}

export async function toggleListValue(id: number) {
  await requireUserId();
  await transaction(async (tx) => {
    const row = await tx.stockListValue.findUniqueOrThrow({ where: { id } });
    await tx.stockListValue.update({ where: { id }, data: { active: !row.active } });
  });
  done();
}

function cellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object" && !(value instanceof Date)) {
    if ("result" in value) return cellText(value.result as ExcelJS.CellValue);
    if ("richText" in value) return value.richText.map((t) => t.text).join("").trim();
    if ("text" in value) return String(value.text).trim();
  }
  return String(value).trim();
}

export async function importExcel(_prev: ActionState, form: FormData): Promise<ActionState> {
  const result = await runAction(async () => {
    const userId = await requireUserId();
    const kind = formText(form, "kind");
    const file = form.get("file");
    if (!(file instanceof File) || !file.name.toLowerCase().endsWith(".xlsx") || !["stok", "cari"].includes(kind)) {
      throw new StockError("Excel (.xlsx) dosyası ve aktarım türünü seçin.");
    }
    const wb = new ExcelJS.Workbook();
    try {
      await wb.xlsx.load(await file.arrayBuffer());
    } catch {
      throw new StockError("Excel dosyası okunamadı.");
    }
    const ws = wb.worksheets[0];
    if (!ws) throw new StockError("Excel dosyasında sayfa bulunamadı.");
    const headers: string[] = [];
    ws.getRow(1).eachCell((c, col) => { headers[col] = cellText(c.value); });
    const rows: Record<string, string>[] = [];
    ws.eachRow((row, idx) => {
      if (idx === 1) return;
      const item: Record<string, string> = {};
      headers.forEach((h, col) => { if (h) item[h] = cellText(row.getCell(col).value); });
      if (Object.values(item).some(Boolean)) rows.push(item);
    });

    const key = (...parts: string[]) => parts.map((p) => p.toLocaleLowerCase("tr")).join("|");
    let added = 0, skipped = 0;
    await transaction(async (tx) => {
      if (kind === "stok") {
        const existing = new Set((await tx.stockItem.findMany()).map((s) => key(s.brand, s.model, s.name)));
        for (const r of rows) {
          const brand = r.marka ?? "", model = r.model ?? "", name = r.urun_adi ?? "", category = r.kategori || "Diğer";
          const opening = Number(r.mevcut_stok || 0), minimum = Number(r.minimum_stok || 0);
          let prices: (number | null)[];
          try {
            prices = [r.satis_try, r.satis_eur, r.satis_usd, r.satis_gbp].map((p) => parseMoney(p));
          } catch { skipped++; continue; }
          if (!brand || !name || existing.has(key(brand, model, name)) || !Number.isInteger(opening) || opening < 0
            || !Number.isInteger(minimum) || minimum < 0 || prices.some((p) => p !== null && p < 0)) {
            skipped++; continue;
          }
          const code = await nextCode(tx, "STK", false);
          const item = await tx.stockItem.create({
            data: {
              code, category, brand, model, name, minQuantity: minimum,
              priceTry: prices[0], priceEur: prices[1], priceUsd: prices[2], priceGbp: prices[3],
            },
          });
          await changeStock(tx, { stockItemId: item.id, delta: opening, type: "Excel açılış stoğu", ref: "EXCEL-AKTARIM", note: "Excel aktarımından gelen başlangıç stoğu", userId });
          for (const line of (r.arac_uyumluluk ?? "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean)) {
            const [fb, fm, y1, y2] = line.split("|").map((p) => p.trim());
            if (!fb || !fm) continue;
            await tx.vehicleFit.create({ data: { stockItemId: item.id, brand: fb, model: fm, yearFrom: Number(y1) || null, yearTo: Number(y2) || null } });
          }
          await rememberListValue(tx, "Ürün Kategorisi", category);
          await rememberListValue(tx, "Ürün Markası", brand);
          await rememberListValue(tx, "Ürün Modeli", model);
          existing.add(key(brand, model, name));
          added++;
        }
      } else {
        const existing = new Set((await tx.customer.findMany()).map((c) => key(c.name, c.phone ?? "")));
        for (const r of rows) {
          const name = r.ad_soyad_unvan ?? "", phone = r.telefon ?? "";
          if (!name || existing.has(key(name, phone))) { skipped++; continue; }
          const code = await nextCode(tx, "CAR", false);
          const type = r.tur || "Şahıs";
          await tx.customer.create({
            data: {
              code, type, name, phone: phone || null, address: r.adres || null, email: r.email || null,
              contactPerson: r.yetkili || null, notes: r.notlar || null,
            },
          });
          await rememberListValue(tx, "Cari Türü", type);
          existing.add(key(name, phone));
          added++;
        }
      }
      await tx.importLog.create({
        data: { fileName: file.name, kind, added, skipped, note: "Mükerrer kayıtlar atlandı; mevcut kayıtların üzerine yazılmadı." },
      });
    });
    return `Aktarım tamamlandı. Eklenen: ${added}, atlanan: ${skipped}.`;
  });
  if (!result?.error) done();
  return result;
}
