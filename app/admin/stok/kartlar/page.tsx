import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Plus, Search } from "lucide-react";
import { listValues } from "@/lib/stok/server";
import { BASE_CURRENCIES, PRICE_FIELDS, formatMoney } from "@/lib/stok/format";
import { Badge, Card, Empty, PageHeader, Table, btnPrimary, btnSecondary, inputCls, tdCls, thCls } from "@/components/stok/ui";

export default async function StockCardsPage({ searchParams }: {
  searchParams: Promise<{ q?: string; kategori?: string; yil?: string; durum?: string }>;
}) {
  const { q = "", kategori = "", yil = "", durum = "aktif" } = await searchParams;
  const [all, categories] = await Promise.all([
    prisma.stockItem.findMany({ include: { fits: true }, orderBy: [{ brand: "asc" }, { model: "asc" }] }),
    listValues("Ürün Kategorisi"),
  ]);

  const needle = q.trim().toLocaleLowerCase("tr");
  const year = Number(yil) || null;
  const items = all.filter((p) => {
    if (durum === "aktif" && !p.active) return false;
    if (durum === "pasif" && p.active) return false;
    if (durum === "kritik" && (!p.active || p.quantity > p.minQuantity)) return false;
    if (kategori && p.category !== kategori) return false;
    if (needle) {
      const hay = [p.code, p.category, p.brand, p.model, p.name, ...p.fits.map((f) => `${f.brand} ${f.model} ${f.yearFrom ?? ""} ${f.yearTo ?? ""}`)]
        .join(" ").toLocaleLowerCase("tr");
      if (!hay.includes(needle)) return false;
    }
    if (year && !p.fits.some((f) => (!f.yearFrom || f.yearFrom <= year) && (!f.yearTo || f.yearTo >= year))) return false;
    return true;
  });

  return (
    <div>
      <PageHeader
        title="Stok Kartları"
        subtitle={`${items.length} kart · ${items.reduce((s, i) => s + i.quantity, 0)} adet`}
        crumbs={[{ href: "/admin/stok/kartlar", label: "Stok Kartları" }]}
        actions={<Link href="/admin/stok/kartlar/yeni" className={btnPrimary}><Plus className="w-4 h-4" /> Yeni Stok Kartı</Link>}
      />

      <form className="grid grid-cols-1 md:grid-cols-[1fr_200px_140px_160px_auto] gap-3 mb-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input name="q" defaultValue={q} placeholder="Kod, marka, model, ürün adı veya araç ara…" className={`${inputCls} pl-9`} />
        </div>
        <select name="kategori" defaultValue={kategori} className={inputCls}>
          <option value="">Tüm kategoriler</option>
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>
        <input name="yil" defaultValue={yil} placeholder="Araç yılı" inputMode="numeric" className={inputCls} />
        <select name="durum" defaultValue={durum} className={inputCls}>
          <option value="aktif">Aktif kartlar</option>
          <option value="kritik">Kritik stok</option>
          <option value="pasif">Pasif kartlar</option>
          <option value="hepsi">Hepsi</option>
        </select>
        <button className={btnSecondary}>Filtrele</button>
      </form>

      <Card padded={false}>
        {items.length === 0 ? <Empty>Aramaya uyan stok kartı yok.</Empty> : (
          <Table head={
            <tr>
              <th className={thCls}>Kod</th><th className={thCls}>Marka / Model</th><th className={thCls}>Ürün</th>
              <th className={thCls}>Kategori</th><th className={thCls}>Satış fiyatı</th><th className={thCls}>Stok</th>
            </tr>
          }>
            {items.map((p) => {
              const prices = BASE_CURRENCIES.filter((c) => p[PRICE_FIELDS[c]] !== null);
              const critical = p.quantity <= p.minQuantity;
              return (
                <tr key={p.id} className="hover:bg-[#111111]">
                  <td className={`${tdCls} whitespace-nowrap`}>
                    <Link href={`/admin/stok/kartlar/${p.id}`} className="text-white font-medium hover:text-[#E4171E]">{p.code}</Link>
                  </td>
                  <td className={tdCls}>
                    <Link href={`/admin/stok/kartlar/${p.id}`} className="text-white hover:text-[#E4171E]">{p.brand} {p.model}</Link>
                    {p.fits.length > 0 && <div className="text-gray-600 text-xs mt-0.5">{p.fits.length} araç uyumluluğu</div>}
                  </td>
                  <td className={tdCls}>{p.name}{!p.active && <> <Badge>Pasif</Badge></>}</td>
                  <td className={tdCls}>{p.category}</td>
                  <td className={`${tdCls} whitespace-nowrap`}>
                    {prices.length ? prices.map((c) => <div key={c}>{formatMoney(p[PRICE_FIELDS[c]], c)}</div>) : <span className="text-gray-600">—</span>}
                  </td>
                  <td className={tdCls}>
                    <Badge tone={p.quantity === 0 ? "red" : critical ? "yellow" : "green"}>{p.quantity} adet</Badge>
                    {p.minQuantity > 0 && <div className="text-gray-600 text-xs mt-1">min. {p.minQuantity}</div>}
                  </td>
                </tr>
              );
            })}
          </Table>
        )}
      </Card>
    </div>
  );
}
