import ExcelJS from "exceljs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { addSheet, excelResponse } from "@/lib/stok/excel";

const TEMPLATES = {
  stok: {
    headers: ["kategori", "marka", "model", "urun_adi", "satis_try", "satis_eur", "satis_usd", "satis_gbp", "mevcut_stok", "minimum_stok", "arac_uyumluluk"],
    example: ["Teyp Çerçevesi", "TOYOTA", "COROLLA 2019", "OTO ÇERÇEVE", "", "", "", "", 5, 1, "Toyota | Corolla | 2019 | 2023"],
  },
  cari: {
    headers: ["tur", "ad_soyad_unvan", "telefon", "adres", "email", "yetkili", "notlar"],
    example: ["Firma", "Örnek Elektronik", "05330000000", "Lefkoşa", "", "Ali", ""],
  },
};

export async function GET(_req: Request, { params }: { params: Promise<{ kind: string }> }) {
  if (!(await getServerSession(authOptions))) return new Response("Yetkisiz erişim", { status: 401 });
  const { kind } = await params;
  const template = TEMPLATES[kind as keyof typeof TEMPLATES];
  if (!template) return new Response("Bulunamadı", { status: 404 });
  const wb = new ExcelJS.Workbook();
  addSheet(wb, kind === "stok" ? "Stok" : "Cari", template.headers, [template.example]);
  return excelResponse(wb, `${kind}_aktarim_sablonu.xlsx`);
}
