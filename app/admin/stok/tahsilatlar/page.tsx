import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Plus, Search } from "lucide-react";
import { formatDay, formatMoney } from "@/lib/stok/format";
import { Card, Empty, PageHeader, Table, btnPrimary, inputCls, tdCls, thCls } from "@/components/stok/ui";
import AutoFilterForm from "@/components/stok/AutoFilterForm";

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const all = await prisma.payment.findMany({
    include: { customer: true, user: true, allocations: { include: { sale: { select: { code: true } } } } },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });
  const needle = q.trim().toLocaleLowerCase("tr");
  const payments = needle
    ? all.filter((p) => [p.code, p.customer.name, p.customer.code, p.note].join(" ").toLocaleLowerCase("tr").includes(needle))
    : all;

  return (
    <div>
      <PageHeader
        title="Tahsilatlar"
        subtitle={`${payments.length} tahsilat`}
        crumbs={[{ href: "/admin/stok/tahsilatlar", label: "Tahsilatlar" }]}
        actions={<Link href="/admin/stok/tahsilatlar/yeni" className={btnPrimary}><Plus className="w-4 h-4" /> Yeni Tahsilat</Link>}
      />
      <AutoFilterForm className="mb-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input name="q" defaultValue={q} placeholder="Makbuz no veya cari ara…" className={`${inputCls} pl-9`} />
        </div>
      </AutoFilterForm>
      <Card padded={false}>
        {payments.length === 0 ? <Empty>Tahsilat bulunamadı.</Empty> : (
          <Table head={<tr><th className={thCls}>Makbuz</th><th className={thCls}>Cari</th><th className={thCls}>Yöntem</th><th className={thCls}>Bağlı satışlar</th><th className={`${thCls} text-right`}>Tutar</th></tr>}>
            {payments.map((p) => (
              <tr key={p.id} className="hover:bg-[#111111]">
                <td className={`${tdCls} whitespace-nowrap`}>
                  <Link href={`/admin/stok/tahsilatlar/${p.id}/makbuz`} className="text-white font-medium hover:text-[#E4171E]">{p.code}</Link>
                  <div className="text-gray-600 text-xs">{formatDay(p.date)} · {p.user?.username ?? "—"}</div>
                </td>
                <td className={tdCls}><Link href={`/admin/stok/cariler/${p.customerId}`} className="hover:text-white">{p.customer.name}</Link></td>
                <td className={tdCls}>{p.method}{p.note && <div className="text-gray-600 text-xs">{p.note}</div>}</td>
                <td className={tdCls}>{p.allocations.length ? p.allocations.map((a) => <div key={a.id}>{a.sale.code} <span className="text-gray-600">({formatMoney(a.amount, p.currency)})</span></div>) : <span className="text-gray-600">Genel tahsilat</span>}</td>
                <td className={`${tdCls} text-right whitespace-nowrap text-white font-semibold`}>{formatMoney(p.amount, p.currency)}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
