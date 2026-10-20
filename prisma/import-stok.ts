/**
 * Başlangıç stok/satış verisini (prisma/stok-seed) veritabanına bir kerelik aktarır.
 *
 *   npx tsx prisma/import-stok.ts [excel-yolu] [--reset]
 *
 * --reset: stok/satış tablolarını boşaltıp baştan aktarır (ürün kataloğuna dokunmaz).
 */
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import ExcelJS from "exceljs";
import bcrypt from "bcryptjs";
import path from "path";
import fs from "fs";

const dbPath = path.resolve(process.cwd(), "prisma", "dev.db");
const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: `file:${dbPath}` }) } as never);

const args = process.argv.slice(2);
const reset = args.includes("--reset");
const excelPath = path.resolve(args.find((a) => !a.startsWith("--")) ?? "prisma/stok-seed/stok_satis_guncel.xlsx");

const STOCK_USERS = [
  { username: "turgut", name: "Turgut", legacy: ["turgut"] },
  { username: "nazlı", name: "Nazlı", legacy: ["naz", "nazlı"] },
  { username: "sirmen", name: "Sirmen", legacy: ["sirmen"] },
];
const DEFAULT_PASSWORD = "123";

type Row = Record<string, unknown>;

function cellValue(value: ExcelJS.CellValue): unknown {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value;
  if (typeof value === "object") {
    if ("result" in value) return cellValue(value.result as ExcelJS.CellValue);
    if ("richText" in value) return value.richText.map((t) => t.text).join("");
    if ("text" in value) return value.text;
    return null;
  }
  return value;
}

function sheetRows(wb: ExcelJS.Workbook, name: string): Row[] {
  const ws = wb.getWorksheet(name);
  if (!ws) throw new Error(`Excel sayfası bulunamadı: ${name}`);
  const headers: string[] = [];
  ws.getRow(1).eachCell((cell, col) => { headers[col] = String(cell.value ?? "").trim(); });
  const rows: Row[] = [];
  ws.eachRow((row, idx) => {
    if (idx === 1) return;
    const item: Row = {};
    let filled = false;
    headers.forEach((h, col) => {
      if (!h) return;
      const v = cellValue(row.getCell(col).value);
      if (v !== null && v !== "") filled = true;
      item[h] = v;
    });
    if (filled) rows.push(item);
  });
  return rows;
}

const text = (v: unknown): string | null => {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s ? s : null;
};
const int = (v: unknown): number => (v === null || v === undefined || v === "" ? 0 : Math.trunc(Number(v)));
const cents = (v: unknown): number | null => {
  if (v === null || v === undefined || String(v).trim() === "") return null;
  return Math.round(Number(String(v).replace(",", ".")) * 100);
};
const day = (v: unknown): string => {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v ?? "").trim().slice(0, 10);
};
const timestamp = (v: unknown): Date => {
  if (v instanceof Date) return v;
  const s = String(v ?? "").trim();
  if (!s) return new Date();
  return new Date(s.length <= 10 ? `${s}T00:00:00` : s.replace(" ", "T"));
};

async function main() {
  if (!fs.existsSync(excelPath)) throw new Error(`Excel dosyası yok: ${excelPath}`);
  console.log(`Kaynak: ${excelPath}`);

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(excelPath);
  const sheet = (name: string) => sheetRows(wb, name);

  const existing = await prisma.stockItem.count();
  if (existing > 0 && !reset) {
    throw new Error(`Veritabanında zaten ${existing} stok kartı var. Baştan aktarmak için --reset ekleyin.`);
  }
  if (reset) {
    console.log("Stok/satış tabloları boşaltılıyor…");
    await prisma.$transaction([
      prisma.paymentAllocation.deleteMany(), prisma.payment.deleteMany(),
      prisma.saleReturnLine.deleteMany(), prisma.saleReturn.deleteMany(),
      prisma.saleLine.deleteMany(), prisma.sale.deleteMany(),
      prisma.stockReceiptLine.deleteMany(), prisma.stockReceipt.deleteMany(),
      prisma.stockAdjustment.deleteMany(), prisma.stockMovement.deleteMany(),
      prisma.vehicleFit.deleteMany(), prisma.stockItem.deleteMany(), prisma.customer.deleteMany(),
      prisma.auditLog.deleteMany(), prisma.importLog.deleteMany(),
      prisma.stockSetting.deleteMany(), prisma.stockListValue.deleteMany(),
    ]);
  }

  // --- Kullanıcılar ---
  const hash = await bcrypt.hash(DEFAULT_PASSWORD, 12);
  const userIdByLegacy = new Map<string, number>();
  for (const u of STOCK_USERS) {
    const user = await prisma.user.upsert({
      where: { username: u.username },
      update: {},
      create: { username: u.username, name: u.name, password: hash, role: "admin" },
    });
    for (const legacy of u.legacy) userIdByLegacy.set(legacy, user.id);
  }
  const firstAdmin = await prisma.user.findFirst({ where: { email: "admin@dselectronics.com", username: null } });
  if (firstAdmin) await prisma.user.update({ where: { id: firstAdmin.id }, data: { username: "admin" } });
  const userOf = (v: unknown) => userIdByLegacy.get(String(v ?? "").trim()) ?? null;
  for (const name of new Set(sheet("StokHareket").map((r) => String(r.kullanici ?? "")))) {
    if (name && !userIdByLegacy.has(name)) console.warn(`  ! Eşleşmeyen kullanıcı adı: ${name}`);
  }

  await prisma.$transaction(async (tx) => {
    // --- Ayarlar ve listeler ---
    for (const r of sheet("Ayarlar")) {
      const key = String(r.anahtar ?? "");
      if (key === "sirket_adi" || key.startsWith("sequence_")) {
        await tx.stockSetting.create({ data: { key, value: String(r.deger ?? "") } });
      }
    }
    const legacyLogo = [path.dirname(excelPath), path.resolve(path.dirname(excelPath), "..")]
      .map((dir) => path.join(dir, "derin_sahil_logo.png"))
      .find((p) => fs.existsSync(p));
    if (legacyLogo) {
      const target = path.resolve("public", "uploads", "stok-logo.png");
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(legacyLogo, target);
      await tx.stockSetting.create({ data: { key: "logo_yolu", value: "/uploads/stok-logo.png" } });
    }
    const seen = new Set<string>();
    for (const r of sheet("Listeler")) {
      const group = text(r.tur), value = text(r.deger);
      if (!group || !value || seen.has(`${group}|${value}`)) continue;
      seen.add(`${group}|${value}`);
      await tx.stockListValue.create({ data: { group, value, active: String(r.aktif ?? "Evet") === "Evet" } });
    }

    // --- Stok kartları ---
    const stockId = new Map<string, number>();
    for (const r of sheet("Stok")) {
      const item = await tx.stockItem.create({
        data: {
          code: String(r.stok_kodu), category: text(r.kategori) ?? "Diğer", brand: text(r.marka) ?? "",
          model: text(r.model) ?? "", name: text(r.urun_adi) ?? "",
          priceTry: cents(r.satis_try), priceEur: cents(r.satis_eur), priceUsd: cents(r.satis_usd), priceGbp: cents(r.satis_gbp),
          quantity: int(r.mevcut_stok), minQuantity: int(r.minimum_stok),
          active: String(r.aktif ?? "Evet") === "Evet", createdAt: timestamp(r.olusturma_tarihi),
        },
      });
      stockId.set(item.code, item.id);
    }
    const sid = (code: unknown) => {
      const id = stockId.get(String(code));
      if (!id) throw new Error(`Bilinmeyen stok kodu: ${code}`);
      return id;
    };
    for (const r of sheet("AracUyumluluk")) {
      await tx.vehicleFit.create({
        data: {
          stockItemId: sid(r.stok_kodu), brand: text(r.arac_marka) ?? "", model: text(r.arac_model) ?? "",
          yearFrom: r.yil_baslangic ? int(r.yil_baslangic) : null, yearTo: r.yil_bitis ? int(r.yil_bitis) : null,
        },
      });
    }

    // --- Cariler ---
    const customerId = new Map<string, number>();
    for (const r of sheet("Cari")) {
      const c = await tx.customer.create({
        data: {
          code: String(r.cari_kodu), type: text(r.tur) ?? "Şahıs", name: text(r.ad_soyad_unvan) ?? "",
          phone: text(r.telefon), address: text(r.adres), email: text(r.email), contactPerson: text(r.yetkili),
          notes: text(r.notlar), active: String(r.aktif ?? "Evet") === "Evet", createdAt: timestamp(r.olusturma_tarihi),
        },
      });
      customerId.set(c.code, c.id);
    }
    const cid = (code: unknown) => {
      const id = customerId.get(String(code));
      if (!id) throw new Error(`Bilinmeyen cari kodu: ${code}`);
      return id;
    };

    // --- Satışlar ---
    const saleId = new Map<string, number>();
    const saleLines = sheet("SatisDetay");
    for (const r of sheet("Satis")) {
      const code = String(r.satis_no);
      const sale = await tx.sale.create({
        data: {
          code, date: day(r.tarih), customerId: cid(r.cari_kodu), currency: text(r.para_birimi) ?? "TRY",
          total: cents(r.toplam) ?? 0, plate: text(r.plaka), notes: text(r.notlar), cancelled: r.durum === "İptal",
          userId: userOf(r.olusturan), createdAt: timestamp(r.olusturma_zamani), updatedAt: timestamp(r.degisiklik_zamani),
          lines: {
            create: saleLines.filter((d) => String(d.satis_no) === code).map((d) => ({
              stockItemId: sid(d.stok_kodu), name: text(d.urun_adi) ?? "", quantity: int(d.miktar),
              unitPrice: cents(d.birim_fiyat) ?? 0, lineTotal: cents(d.satir_toplam) ?? 0,
            })),
          },
        },
      });
      saleId.set(code, sale.id);
    }

    // --- İadeler ---
    const returnLines = sheet("IadeDetay");
    for (const r of sheet("Iadeler")) {
      const code = String(r.iade_no);
      const sId = saleId.get(String(r.satis_no));
      if (!sId) { console.warn(`  ! ${code} iadesinin satışı (${r.satis_no}) bulunamadı, atlandı.`); continue; }
      await tx.saleReturn.create({
        data: {
          code, saleId: sId, date: day(r.tarih), currency: text(r.para_birimi) ?? "TRY", total: cents(r.toplam) ?? 0,
          note: text(r.aciklama), userId: userOf(r.kullanici), createdAt: timestamp(r.tarih),
          lines: {
            create: returnLines.filter((d) => String(d.iade_no) === code).map((d) => ({
              stockItemId: sid(d.stok_kodu), quantity: int(d.miktar),
              unitPrice: cents(d.birim_fiyat) ?? 0, lineTotal: cents(d.satir_toplam) ?? 0,
            })),
          },
        },
      });
    }

    // --- Tahsilatlar ---
    const allocations = sheet("TahsilatDagitim");
    for (const r of sheet("Tahsilat")) {
      const code = String(r.tahsilat_no);
      const allocs = allocations.filter((a) => String(a.tahsilat_no) === code).flatMap((a) => {
        const sId = saleId.get(String(a.satis_no));
        if (!sId) { console.warn(`  ! ${code} dağıtımındaki satış (${a.satis_no}) bulunamadı, atlandı.`); return []; }
        return [{ saleId: sId, amount: cents(a.tutar) ?? 0 }];
      });
      await tx.payment.create({
        data: {
          code, date: day(r.tarih), customerId: cid(r.cari_kodu), currency: text(r.para_birimi) ?? "TRY",
          amount: cents(r.tutar) ?? 0, method: text(r.yontem) ?? "Nakit", note: text(r.aciklama),
          userId: userOf(r.olusturan), createdAt: timestamp(r.tarih), allocations: { create: allocs },
        },
      });
    }

    // --- Stok girişleri ---
    const receiptLines = sheet("StokGirisDetay");
    for (const r of sheet("StokGiris")) {
      const code = String(r.giris_no);
      await tx.stockReceipt.create({
        data: {
          code, date: day(r.tarih), note: text(r.aciklama), userId: userOf(r.olusturan),
          createdAt: timestamp(r.olusturma_zamani), updatedAt: timestamp(r.degisiklik_zamani),
          lines: {
            create: receiptLines.filter((d) => String(d.giris_no) === code).map((d) => ({
              stockItemId: sid(d.stok_kodu), quantity: int(d.miktar), note: text(d.aciklama),
            })),
          },
        },
      });
    }

    // --- Stok düzeltmeleri ve hareketler ---
    for (const r of sheet("StokDuzeltme")) {
      await tx.stockAdjustment.create({
        data: {
          code: String(r.duzeltme_no), date: day(r.tarih), stockItemId: sid(r.stok_kodu),
          oldQuantity: int(r.eski_miktar), newQuantity: int(r.yeni_miktar), difference: int(r.fark),
          reason: text(r.neden) ?? "", userId: userOf(r.kullanici), createdAt: timestamp(r.tarih),
        },
      });
    }
    for (const r of sheet("StokHareket")) {
      await tx.stockMovement.create({
        data: {
          date: timestamp(r.tarih), type: text(r.tip) ?? "", ref: text(r.ref_no) ?? "", stockItemId: sid(r.stok_kodu),
          quantity: int(r.miktar), note: text(r.aciklama), userId: userOf(r.kullanici),
        },
      });
    }

    // --- Geçmiş kayıtları ---
    for (const r of sheet("DegisiklikLog")) {
      await tx.auditLog.create({
        data: {
          kind: text(r.kayit_turu) ?? "", ref: text(r.kayit_no) ?? "", oldValue: text(r.eski_deger), newValue: text(r.yeni_deger),
          userId: userOf(r.kullanici), createdAt: timestamp(r.degisiklik_tarihi),
        },
      });
    }
    for (const r of sheet("AktarimLog")) {
      await tx.importLog.create({
        data: {
          fileName: text(r.dosya) ?? "", kind: text(r.tur) ?? "", added: int(r.eklenen), skipped: int(r.atlanan),
          note: text(r.aciklama), createdAt: timestamp(r.tarih),
        },
      });
    }
    await tx.importLog.create({
      data: { fileName: path.basename(excelPath), kind: "tam aktarım", added: stockId.size, skipped: 0, note: "Eski Excel sisteminden veritabanına taşındı." },
    });
  }, { timeout: 120000 });

  await verify(sheet);
}

async function verify(sheet: (name: string) => Row[]) {
  console.log("\nDoğrulama:");
  let problems = 0;
  const check = (label: string, ok: boolean, detail = "") => {
    console.log(`  ${ok ? "✓" : "✗"} ${label}${detail ? ` — ${detail}` : ""}`);
    if (!ok) problems++;
  };

  const counts: [string, number, number][] = [
    ["Stok kartı", sheet("Stok").length, await prisma.stockItem.count()],
    ["Cari", sheet("Cari").length, await prisma.customer.count()],
    ["Satış", sheet("Satis").length, await prisma.sale.count()],
    ["Satış kalemi", sheet("SatisDetay").length, await prisma.saleLine.count()],
    ["İade", sheet("Iadeler").length, await prisma.saleReturn.count()],
    ["Tahsilat", sheet("Tahsilat").length, await prisma.payment.count()],
    ["Tahsilat dağıtımı", sheet("TahsilatDagitim").length, await prisma.paymentAllocation.count()],
    ["Stok girişi", sheet("StokGiris").length, await prisma.stockReceipt.count()],
    ["Stok düzeltmesi", sheet("StokDuzeltme").length, await prisma.stockAdjustment.count()],
    ["Stok hareketi", sheet("StokHareket").length, await prisma.stockMovement.count()],
    ["Değişiklik kaydı", sheet("DegisiklikLog").length, await prisma.auditLog.count()],
  ];
  for (const [label, expected, actual] of counts) check(`${label}: ${actual}`, expected === actual, expected === actual ? "" : `Excel'de ${expected}`);

  const items = await prisma.stockItem.findMany({ select: { code: true, quantity: true } });
  const sums = await prisma.stockMovement.groupBy({ by: ["stockItemId"], _sum: { quantity: true } });
  const ids = await prisma.stockItem.findMany({ select: { id: true, code: true } });
  const sumByCode = new Map(sums.map((s) => [ids.find((i) => i.id === s.stockItemId)!.code, s._sum.quantity ?? 0]));
  const mismatched = items.filter((i) => i.quantity !== (sumByCode.get(i.code) ?? 0));
  check("Her kartın stoğu = hareket toplamı", mismatched.length === 0, mismatched.slice(0, 5).map((m) => m.code).join(", "));
  const totalUnits = items.reduce((s, i) => s + i.quantity, 0);
  const excelUnits = sheet("Stok").reduce((s, r) => s + int(r.mevcut_stok), 0);
  check(`Toplam stok adedi: ${totalUnits}`, totalUnits === excelUnits);

  // Eski uygulamadaki cari bakiye formülüyle karşılaştırma
  const excelBalance = new Map<string, number>();
  const sales = sheet("Satis"), returns = sheet("Iadeler");
  for (const s of sales) {
    if (s.durum === "İptal") continue;
    const ret = returns.filter((r) => String(r.satis_no) === String(s.satis_no)).reduce((a, r) => a + (cents(r.toplam) ?? 0), 0);
    const key = `${s.cari_kodu}|${s.para_birimi}`;
    excelBalance.set(key, (excelBalance.get(key) ?? 0) + (cents(s.toplam) ?? 0) - ret);
  }
  for (const p of sheet("Tahsilat")) {
    const key = `${p.cari_kodu}|${p.para_birimi}`;
    excelBalance.set(key, (excelBalance.get(key) ?? 0) - (cents(p.tutar) ?? 0));
  }
  const customers = await prisma.customer.findMany({ select: { id: true, code: true } });
  const dbBalance = new Map<string, number>();
  for (const s of await prisma.sale.findMany({ where: { cancelled: false }, include: { returns: true } })) {
    const key = `${customers.find((c) => c.id === s.customerId)!.code}|${s.currency}`;
    dbBalance.set(key, (dbBalance.get(key) ?? 0) + s.total - s.returns.reduce((a, r) => a + r.total, 0));
  }
  for (const p of await prisma.payment.findMany()) {
    const key = `${customers.find((c) => c.id === p.customerId)!.code}|${p.currency}`;
    dbBalance.set(key, (dbBalance.get(key) ?? 0) - p.amount);
  }
  const keys = new Set([...excelBalance.keys(), ...dbBalance.keys()]);
  const balanceDiffs = [...keys].filter((k) => (excelBalance.get(k) ?? 0) !== (dbBalance.get(k) ?? 0));
  check("Cari bakiyeleri eski sistemle aynı", balanceDiffs.length === 0, balanceDiffs.join(", "));
  for (const [k, v] of dbBalance) if (v !== 0) console.log(`      ${k}: ${(v / 100).toFixed(2)}`);

  console.log(problems ? `\n${problems} sorun bulundu.` : "\nAktarım başarılı, tüm kontroller geçti.");
  if (problems) process.exitCode = 1;
}

main()
  .catch((err) => { console.error(err); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
