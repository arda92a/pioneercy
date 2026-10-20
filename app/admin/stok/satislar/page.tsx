import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Plus, Search } from "lucide-react";
import { listValues } from "@/lib/stok/server";
import { saleBalances } from "@/lib/stok/queries";
import { formatDay, formatMoney } from "@/lib/stok/format";
import { Badge, Card, Empty, PageHeader, Table, btnPrimary, btnSecondary, inputCls, tdCls, thCls } from "@/components/stok/ui";

export default async function SalesPage({ searchParams }: {
  searchParams: Promise<{ q?: string; para?: string; durum?: string }>;
}) {
  const { q = "", para = "", durum = "" } = await searchParams;
  const [all, currencies] = await Promise.all([
    prisma.sale.findMany({
      include: { customer: true, lines: { include: { stockItem: true } } },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    }),
    listValues("Para Birimi"),
  ]);
  const balanceOf = await saleBalances(prisma, all.map((s) => s.id));
  const needle = q.trim().toLocaleLowerCase("tr");
  const sales = all
    .map((s) => ({ ...s, ...balanceOf(s.id, s.total) }))
    .filter((s) => {
      if (durum === "iptal" ? !s.cancelled : s.cancelled) return false;
      if (durum === "acik" && s.remaining <= 0) return false;
      if (para && s.currency !== para) return false;
      if (needle) {
        const hay = [s.code, s.customer.name, s.customer.code, s.plate, ...s.lines.map((l) => `${l.stockItem.brand} ${l.stockItem.model}`)].join(" ").toLocaleLowerCase("tr");
        if (!hay.includes(needle)) return false;
      }
      return true;
    });

  return (
    <div>
      <PageHeader
        title="Satışlar"
        subtitle={`${sales.length} satış`}
        crumbs={[{ href: "/admin/stok/satislar", label: "Satışlar" }]}
        actions={<Link href="/admin/stok/satislar/yeni" className={btnPrimary}><Plus className="w-4 h-4" /> Yeni Satış</Link>}
      />
      <form className="grid grid-cols-1 sm:grid-cols-[1fr_140px_180px_auto] gap-3 mb-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input name="q" defaultValue={q} placeholder="Satış no, cari, plaka veya ürün ara…" className={`${inputCls} pl-9`} />
        </div>
        <select name="para" defaultValue={para} className={inputCls}>
          <option value="">Tüm para birimleri</option>
          {currencies.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select name="durum" defaultValue={durum} className={inputCls}>
          <option value="">Aktif satışlar</option>
          <option value="acik">Ödemesi kalanlar</option>
          <option value="iptal">İptal edilenler</option>
        </select>
        <button className={btnSecondary}>Filtrele</button>
      </form>
      <Card padded={false}>
        {sales.length === 0 ? <Empty>Satış bulunamadı.</Empty> : (
          <Table head={<tr><th className={thCls}>Satış</th><th className={thCls}>Cari</th><th className={thCls}>Ürünler</th><th className={`${thCls} text-right`}>Toplam</th><th className={`${thCls} text-right`}>Kalan</th></tr>}>
            {sales.map((s) => (
              <tr key={s.id} className="hover:bg-[#111111]">
                <td className={`${tdCls} whitespace-nowrap`}>
                  <Link href={`/admin/stok/satislar/${s.id}`} className="text-white font-medium hover:text-[#E4171E]">{s.code}</Link>
                  <div className="text-gray-600 text-xs">{formatDay(s.date)}{s.plate && ` · ${s.plate}`}</div>
                </td>
                <td className={tdCls}>{s.customer.name}</td>
                <td className={tdCls}>
                  {s.lines.map((l) => <div key={l.id}>{l.stockItem.brand} {l.stockItem.model} <span className="text-gray-600">× {l.quantity}</span></div>)}
                </td>
                <td className={`${tdCls} text-right whitespace-nowrap`}>
                  {formatMoney(s.total, s.currency)}
                  {s.returned > 0 && <div className="text-gray-600 text-xs">iade −{formatMoney(s.returned, s.currency)}</div>}
                </td>
                <td className={`${tdCls} text-right whitespace-nowrap`}>
                  {s.cancelled ? <Badge>İptal</Badge> : s.remaining > 0 ? <Badge tone="yellow">{formatMoney(s.remaining, s.currency)}</Badge> : <Badge tone="green">Ödendi</Badge>}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
