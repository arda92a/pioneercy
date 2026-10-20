import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Plus, Search } from "lucide-react";
import { customerBalances, nonZero } from "@/lib/stok/queries";
import { Badge, Card, Empty, PageHeader, Table, Totals, btnPrimary, inputCls, tdCls, thCls } from "@/components/stok/ui";
import AutoFilterForm from "@/components/stok/AutoFilterForm";

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string; durum?: string }> }) {
  const { q = "", durum = "aktif" } = await searchParams;
  const [all, balances] = await Promise.all([
    prisma.customer.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { sales: true } } } }),
    customerBalances(prisma),
  ]);
  const needle = q.trim().toLocaleLowerCase("tr");
  const customers = all.filter((c) => {
    if (durum === "aktif" && !c.active) return false;
    if (durum === "pasif" && c.active) return false;
    if (durum === "borclu" && !nonZero(balances.get(c.id) ?? {}).some(([, v]) => v > 0)) return false;
    if (needle && ![c.code, c.name, c.phone, c.email].join(" ").toLocaleLowerCase("tr").includes(needle)) return false;
    return true;
  });

  return (
    <div>
      <PageHeader
        title="Cariler"
        subtitle={`${customers.length} cari`}
        crumbs={[{ href: "/admin/stok/cariler", label: "Cariler" }]}
        actions={<Link href="/admin/stok/cariler/yeni" className={btnPrimary}><Plus className="w-4 h-4" /> Yeni Cari</Link>}
      />
      <AutoFilterForm className="grid grid-cols-1 sm:grid-cols-[1fr_180px] gap-3 mb-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input name="q" defaultValue={q} placeholder="Ad, kod, telefon ara…" className={`${inputCls} pl-9`} />
        </div>
        <select name="durum" defaultValue={durum} className={inputCls}>
          <option value="aktif">Aktif cariler</option>
          <option value="borclu">Borcu olanlar</option>
          <option value="pasif">Pasif cariler</option>
          <option value="hepsi">Hepsi</option>
        </select>
      </AutoFilterForm>
      <Card padded={false}>
        {customers.length === 0 ? <Empty>Cari bulunamadı.</Empty> : (
          <Table head={<tr><th className={thCls}>Kod</th><th className={thCls}>Ad / unvan</th><th className={thCls}>Telefon</th><th className={thCls}>Satış</th><th className={thCls}>Bakiye</th></tr>}>
            {customers.map((c) => {
              const bal = nonZero(balances.get(c.id) ?? {});
              return (
                <tr key={c.id} className="hover:bg-[#111111]">
                  <td className={`${tdCls} whitespace-nowrap`}>{c.code}</td>
                  <td className={tdCls}>
                    <Link href={`/admin/stok/cariler/${c.id}`} className="text-white font-medium hover:text-[#E4171E]">{c.name}</Link>
                    <div className="text-gray-600 text-xs">{c.type}{!c.active && " · Pasif"}</div>
                  </td>
                  <td className={tdCls}>{c.phone ?? "—"}</td>
                  <td className={tdCls}>{c._count.sales}</td>
                  <td className={tdCls}>
                    {bal.length === 0 ? <Badge tone="green">Borç yok</Badge> : (
                      <span className={bal.some(([, v]) => v > 0) ? "text-amber-400 font-semibold" : "text-sky-400"}><Totals totals={bal} /></span>
                    )}
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
