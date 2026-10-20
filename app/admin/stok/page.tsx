import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Boxes, Contact, ShoppingCart, Wallet, AlertTriangle, Plus, PackagePlus } from "lucide-react";
import { addTo, customerBalances, saleBalances, type CurrencyTotals } from "@/lib/stok/queries";
import { formatDay, formatMoney, todayText } from "@/lib/stok/format";
import { Badge, Card, Empty, PageHeader, Stat, Table, Totals, btnPrimary, btnSecondary, tdCls, thCls } from "@/components/stok/ui";

export default async function StockOverviewPage() {
  const today = todayText();
  const month = today.slice(0, 7);

  const [items, customerCount, sales, payments, balances] = await Promise.all([
    prisma.stockItem.findMany({ where: { active: true }, orderBy: { code: "asc" } }),
    prisma.customer.count({ where: { active: true } }),
    prisma.sale.findMany({
      where: { cancelled: false },
      include: { customer: true, returns: { select: { total: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.payment.findMany({ where: { date: today } }),
    customerBalances(prisma),
  ]);

  const salesToday: CurrencyTotals = {}, salesMonth: CurrencyTotals = {}, paymentsToday: CurrencyTotals = {}, receivables: CurrencyTotals = {};
  for (const s of sales) {
    const net = s.total - s.returns.reduce((a, r) => a + r.total, 0);
    if (s.date === today) addTo(salesToday, s.currency, net);
    if (s.date.startsWith(month)) addTo(salesMonth, s.currency, net);
  }
  for (const p of payments) addTo(paymentsToday, p.currency, p.amount);
  for (const totals of balances.values()) for (const [cur, v] of Object.entries(totals)) addTo(receivables, cur, v);

  const low = items.filter((i) => i.quantity <= i.minQuantity);
  const recent = sales.slice(0, 8);
  const balanceOf = await saleBalances(prisma, recent.map((s) => s.id));

  return (
    <div>
      <PageHeader
        title="Stok & Satış — Genel Bakış"
        subtitle="Stok, cari, satış ve tahsilat özetiniz"
        crumbs={[]}
        actions={
          <>
            <Link href="/admin/stok/satislar/yeni" className={btnPrimary}><Plus className="w-4 h-4" /> Yeni Satış</Link>
            <Link href="/admin/stok/girisler/yeni" className={btnSecondary}><PackagePlus className="w-4 h-4" /> Stok Girişi</Link>
            <Link href="/admin/stok/tahsilatlar/yeni" className={btnSecondary}><Wallet className="w-4 h-4" /> Tahsilat</Link>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <Stat label="Aktif stok kartı" value={items.length} hint={`${items.reduce((s, i) => s + i.quantity, 0)} adet stokta`} icon={<Boxes className="w-5 h-5 text-[#E4171E]" />} />
        <Stat label="Aktif cari" value={customerCount} icon={<Contact className="w-5 h-5 text-[#E4171E]" />} />
        <Stat label="Bugünkü satış" value={<Totals totals={salesToday} empty="0" />} icon={<ShoppingCart className="w-5 h-5 text-[#E4171E]" />} />
        <Stat label="Bugünkü tahsilat" value={<Totals totals={paymentsToday} empty="0" />} icon={<Wallet className="w-5 h-5 text-[#E4171E]" />} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Stat label="Bu ayki satış (iadeler düşülmüş)" value={<Totals totals={salesMonth} empty="0" />} />
        <Stat label="Açık alacak (tüm cariler)" value={<Totals totals={receivables} empty="0" />} hint="Satış − iade − tahsilat" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card title="Son satışlar" padded={false} actions={<Link href="/admin/stok/satislar" className="text-[#E4171E] text-xs">Tümünü gör</Link>}>
          {recent.length === 0 ? <Empty>Henüz satış yok.</Empty> : (
            <Table head={<tr><th className={thCls}>Satış</th><th className={thCls}>Cari</th><th className={thCls}>Toplam</th><th className={thCls}>Kalan</th></tr>}>
              {recent.map((s) => {
                const b = balanceOf(s.id, s.total);
                return (
                  <tr key={s.id} className="hover:bg-[#111111]">
                    <td className={tdCls}>
                      <Link href={`/admin/stok/satislar/${s.id}`} className="text-white font-medium hover:text-[#E4171E]">{s.code}</Link>
                      <div className="text-gray-600 text-xs">{formatDay(s.date)}</div>
                    </td>
                    <td className={tdCls}>{s.customer.name}</td>
                    <td className={tdCls}>{formatMoney(s.total, s.currency)}</td>
                    <td className={tdCls}>{b.remaining > 0 ? <Badge tone="yellow">{formatMoney(b.remaining, s.currency)}</Badge> : <Badge tone="green">Ödendi</Badge>}</td>
                  </tr>
                );
              })}
            </Table>
          )}
        </Card>

        <Card
          title={<span className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-400" /> Kritik stok ({low.length})</span>}
          padded={false}
          actions={<Link href="/admin/stok/kartlar?durum=kritik" className="text-[#E4171E] text-xs">Listede gör</Link>}
        >
          {low.length === 0 ? <Empty>Minimum stok seviyesinin altında ürün yok.</Empty> : (
            <div className="max-h-[420px] overflow-y-auto">
              <Table head={<tr><th className={thCls}>Ürün</th><th className={thCls}>Mevcut</th><th className={thCls}>Min.</th></tr>}>
                {low.map((i) => (
                  <tr key={i.id} className="hover:bg-[#111111]">
                    <td className={tdCls}>
                      <Link href={`/admin/stok/kartlar/${i.id}`} className="text-white hover:text-[#E4171E]">{i.brand} {i.model}</Link>
                      <div className="text-gray-600 text-xs">{i.code} · {i.name}</div>
                    </td>
                    <td className={tdCls}><Badge tone={i.quantity === 0 ? "red" : "yellow"}>{i.quantity}</Badge></td>
                    <td className={tdCls}>{i.minQuantity}</td>
                  </tr>
                ))}
              </Table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
