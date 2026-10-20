import ExcelJS from "exceljs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { customerBalances } from "@/lib/stok/queries";
import { addSheet, excelResponse, money } from "@/lib/stok/excel";
import { todayText } from "@/lib/stok/format";

export async function GET() {
  if (!(await getServerSession(authOptions))) return new Response("Yetkisiz erişim", { status: 401 });

  const [items, fits, customers, sales, returns, payments, receipts, adjustments, movements, balances] = await Promise.all([
    prisma.stockItem.findMany({ orderBy: { code: "asc" } }),
    prisma.vehicleFit.findMany({ include: { stockItem: true } }),
    prisma.customer.findMany({ orderBy: { code: "asc" } }),
    prisma.sale.findMany({ include: { customer: true, user: true, lines: { include: { stockItem: true } } }, orderBy: { code: "asc" } }),
    prisma.saleReturn.findMany({ include: { sale: true, user: true, lines: { include: { stockItem: true } } }, orderBy: { code: "asc" } }),
    prisma.payment.findMany({ include: { customer: true, user: true, allocations: { include: { sale: true } } }, orderBy: { code: "asc" } }),
    prisma.stockReceipt.findMany({ include: { user: true, lines: { include: { stockItem: true } } }, orderBy: { code: "asc" } }),
    prisma.stockAdjustment.findMany({ include: { stockItem: true, user: true }, orderBy: { code: "asc" } }),
    prisma.stockMovement.findMany({ include: { stockItem: true, user: true }, orderBy: [{ date: "asc" }, { id: "asc" }] }),
    customerBalances(prisma),
  ]);
  const yesNo = (b: boolean) => (b ? "Evet" : "Hayır");
  const wb = new ExcelJS.Workbook();

  addSheet(wb, "Stok", ["stok_kodu", "kategori", "marka", "model", "urun_adi", "satis_try", "satis_eur", "satis_usd", "satis_gbp", "mevcut_stok", "minimum_stok", "aktif"],
    items.map((i) => [i.code, i.category, i.brand, i.model, i.name, money(i.priceTry), money(i.priceEur), money(i.priceUsd), money(i.priceGbp), i.quantity, i.minQuantity, yesNo(i.active)]));
  addSheet(wb, "AracUyumluluk", ["stok_kodu", "arac_marka", "arac_model", "yil_baslangic", "yil_bitis"],
    fits.map((f) => [f.stockItem.code, f.brand, f.model, f.yearFrom, f.yearTo]));
  addSheet(wb, "Cari", ["cari_kodu", "tur", "ad_soyad_unvan", "telefon", "adres", "email", "yetkili", "notlar", "aktif"],
    customers.map((c) => [c.code, c.type, c.name, c.phone, c.address, c.email, c.contactPerson, c.notes, yesNo(c.active)]));
  addSheet(wb, "Satis", ["satis_no", "tarih", "cari_kodu", "cari_adi", "para_birimi", "toplam", "plaka", "notlar", "durum", "olusturan"],
    sales.map((s) => [s.code, s.date, s.customer.code, s.customer.name, s.currency, money(s.total), s.plate, s.notes, s.cancelled ? "İptal" : "Aktif", s.user?.username]));
  addSheet(wb, "SatisDetay", ["satis_no", "tarih", "cari_adi", "stok_kodu", "marka", "model", "urun_adi", "miktar", "birim_fiyat", "para_birimi", "satir_toplam", "durum"],
    sales.flatMap((s) => s.lines.map((l) => [s.code, s.date, s.customer.name, l.stockItem.code, l.stockItem.brand, l.stockItem.model, l.name, l.quantity, money(l.unitPrice), s.currency, money(l.lineTotal), s.cancelled ? "İptal" : "Aktif"])));
  addSheet(wb, "Iadeler", ["iade_no", "satis_no", "tarih", "stok_kodu", "miktar", "birim_fiyat", "satir_toplam", "para_birimi", "aciklama", "kullanici"],
    returns.flatMap((r) => r.lines.map((l) => [r.code, r.sale.code, r.date, l.stockItem.code, l.quantity, money(l.unitPrice), money(l.lineTotal), r.currency, r.note, r.user?.username])));
  addSheet(wb, "Tahsilat", ["tahsilat_no", "tarih", "cari_kodu", "cari_adi", "para_birimi", "tutar", "yontem", "aciklama", "bagli_satislar", "olusturan"],
    payments.map((p) => [p.code, p.date, p.customer.code, p.customer.name, p.currency, money(p.amount), p.method, p.note,
      p.allocations.map((a) => `${a.sale.code}: ${money(a.amount)}`).join("; "), p.user?.username]));
  addSheet(wb, "StokGiris", ["giris_no", "tarih", "stok_kodu", "marka", "model", "miktar", "satir_notu", "aciklama", "olusturan"],
    receipts.flatMap((r) => r.lines.map((l) => [r.code, r.date, l.stockItem.code, l.stockItem.brand, l.stockItem.model, l.quantity, l.note, r.note, r.user?.username])));
  addSheet(wb, "StokDuzeltme", ["duzeltme_no", "tarih", "stok_kodu", "marka", "model", "eski_miktar", "yeni_miktar", "fark", "neden", "kullanici"],
    adjustments.map((a) => [a.code, a.date, a.stockItem.code, a.stockItem.brand, a.stockItem.model, a.oldQuantity, a.newQuantity, a.difference, a.reason, a.user?.username]));
  addSheet(wb, "StokHareket", ["tarih", "tip", "ref_no", "stok_kodu", "marka", "model", "miktar", "aciklama", "kullanici"],
    movements.map((m) => [m.date, m.type, m.ref, m.stockItem.code, m.stockItem.brand, m.stockItem.model, m.quantity, m.note, m.user?.username]));
  addSheet(wb, "CariBakiyeler", ["cari_kodu", "cari_adi", "para_birimi", "bakiye"],
    customers.flatMap((c) => Object.entries(balances.get(c.id) ?? {}).filter(([, v]) => v !== 0).map(([cur, v]) => [c.code, c.name, cur, money(v)])));

  return excelResponse(wb, `stok_satis_${todayText()}.xlsx`);
}
