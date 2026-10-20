import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Plus } from "lucide-react";
import { formatDay } from "@/lib/stok/format";
import { Card, Empty, PageHeader, Table, btnPrimary, btnSmall, tdCls, thCls } from "@/components/stok/ui";

export default async function StockReceiptsPage() {
  const receipts = await prisma.stockReceipt.findMany({
    include: { lines: { include: { stockItem: true } }, user: true },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div>
      <PageHeader
        title="Stok Girişleri"
        subtitle="Gelen malları fişle stoğa ekleyin"
        crumbs={[{ href: "/admin/stok/girisler", label: "Stok Girişleri" }]}
        actions={<Link href="/admin/stok/girisler/yeni" className={btnPrimary}><Plus className="w-4 h-4" /> Yeni Stok Girişi</Link>}
      />
      <Card padded={false}>
        {receipts.length === 0 ? <Empty>Henüz stok girişi yok.</Empty> : (
          <Table head={<tr><th className={thCls}>Fiş</th><th className={thCls}>Tarih</th><th className={thCls}>Ürünler</th><th className={thCls}>Toplam adet</th><th className={thCls}>Kullanıcı</th><th className={thCls} /></tr>}>
            {receipts.map((r) => (
              <tr key={r.id} className="hover:bg-[#111111]">
                <td className={`${tdCls} whitespace-nowrap`}>
                  <Link href={`/admin/stok/girisler/${r.id}/fis`} className="text-white font-medium hover:text-[#E4171E]">{r.code}</Link>
                  {r.note && <div className="text-gray-600 text-xs">{r.note}</div>}
                </td>
                <td className={`${tdCls} whitespace-nowrap`}>{formatDay(r.date)}</td>
                <td className={tdCls}>
                  {r.lines.map((l) => <div key={l.id}>{l.stockItem.brand} {l.stockItem.model} <span className="text-gray-600">× {l.quantity}</span></div>)}
                </td>
                <td className={tdCls}>{r.lines.reduce((s, l) => s + l.quantity, 0)}</td>
                <td className={tdCls}>{r.user?.username ?? "—"}</td>
                <td className={`${tdCls} text-right whitespace-nowrap`}>
                  <Link href={`/admin/stok/girisler/${r.id}`} className={btnSmall}>Düzenle</Link>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
