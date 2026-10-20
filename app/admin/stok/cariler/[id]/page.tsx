import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Plus, Wallet } from "lucide-react";
import { listValues } from "@/lib/stok/server";
import { saveCustomer, toggleCustomer } from "@/lib/stok/actions/sales";
import { addTo, nonZero, type CurrencyTotals } from "@/lib/stok/queries";
import { formatDay, formatMoney } from "@/lib/stok/format";
import CustomerForm from "@/components/stok/CustomerForm";
import { ActionButton } from "@/components/stok/ActionForm";
import PrintButton from "@/components/stok/PrintButton";
import { Badge, Card, Empty, PageHeader, Table, Totals, btnPrimary, btnSecondary, inputCls, labelCls, tdCls, thCls } from "@/components/stok/ui";

type Event = { date: string; kind: "Satış" | "Satış İadesi" | "Tahsilat"; code: string; href: string; currency: string; debit: number; credit: number; note: string | null };
const ORDER = { "Satış": 0, "Satış İadesi": 1, "Tahsilat": 2 };

export default async function CustomerPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ baslangic?: string; bitis?: string }>;
}) {
  const id = Number((await params).id);
  const { baslangic = "", bitis = "" } = await searchParams;
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) notFound();

  const [types, sales, returns, payments] = await Promise.all([
    listValues("Cari Türü"),
    prisma.sale.findMany({ where: { customerId: id, cancelled: false } }),
    prisma.saleReturn.findMany({ where: { sale: { customerId: id, cancelled: false } } }),
    prisma.payment.findMany({ where: { customerId: id } }),
  ]);

  const events: Event[] = [
    ...sales.map((s) => ({ date: s.date, kind: "Satış" as const, code: s.code, href: `/admin/stok/satislar/${s.id}`, currency: s.currency, debit: s.total, credit: 0, note: s.plate ? `Plaka: ${s.plate}` : s.notes })),
    ...returns.map((r) => ({ date: r.date, kind: "Satış İadesi" as const, code: r.code, href: `/admin/stok/satislar/${r.saleId}`, currency: r.currency, debit: 0, credit: r.total, note: r.note })),
    ...payments.map((p) => ({ date: p.date, kind: "Tahsilat" as const, code: p.code, href: `/admin/stok/tahsilatlar/${p.id}/makbuz`, currency: p.currency, debit: 0, credit: p.amount, note: [p.method, p.note].filter(Boolean).join(" · ") })),
  ].sort((a, b) => a.date.localeCompare(b.date) || ORDER[a.kind] - ORDER[b.kind] || a.code.localeCompare(b.code));

  const opening: CurrencyTotals = {}, running: CurrencyTotals = {};
  const rows: (Event & { balance: number })[] = [];
  for (const e of events) {
    if (baslangic && e.date < baslangic) { addTo(opening, e.currency, e.debit - e.credit); continue; }
    if (bitis && e.date > bitis) continue;
    if (!(e.currency in running)) running[e.currency] = opening[e.currency] ?? 0;
    running[e.currency] += e.debit - e.credit;
    rows.push({ ...e, balance: running[e.currency] });
  }
  const total: CurrencyTotals = {};
  for (const e of events) addTo(total, e.currency, e.debit - e.credit);
  const balance = nonZero(total);

  return (
    <div>
      <PageHeader
        title={customer.name}
        subtitle={<>{customer.code} · {customer.type}{customer.phone && ` · ${customer.phone}`} {!customer.active && <Badge>Pasif</Badge>}</>}
        crumbs={[{ href: "/admin/stok/cariler", label: "Cariler" }, { href: `/admin/stok/cariler/${id}`, label: customer.code }]}
        actions={
          <>
            {customer.active && <Link href={`/admin/stok/satislar/yeni?cari=${id}`} className={btnPrimary}><Plus className="w-4 h-4" /> Satış</Link>}
            {customer.active && <Link href={`/admin/stok/tahsilatlar/yeni?cari=${id}`} className={btnSecondary}><Wallet className="w-4 h-4" /> Tahsilat al</Link>}
            <ActionButton action={toggleCustomer.bind(null, id)} className={btnSecondary}
              confirmText={customer.active ? "Cari pasife alınsın mı? Pasif cariler yeni satış ve tahsilatta görünmez." : undefined}>
              {customer.active ? "Pasife al" : "Aktifleştir"}
            </ActionButton>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 print:hidden">
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5 sm:col-span-1">
          <div className="text-gray-500 text-sm mb-2">Güncel bakiye</div>
          <div className={`text-2xl font-black ${balance.some(([, v]) => v > 0) ? "text-amber-400" : "text-white"}`}>
            {balance.length ? <Totals totals={balance} /> : "Borç yok"}
          </div>
          <div className="text-gray-600 text-xs mt-1">Pozitif tutar cari borcudur; negatif tutar fazla ödemedir.</div>
        </div>
        <details className="sm:col-span-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl">
          <summary className="cursor-pointer px-5 py-4 text-white font-semibold text-sm">Cari bilgilerini düzenle</summary>
          <div className="px-5 pb-5"><CustomerForm action={saveCustomer.bind(null, id)} customer={customer} types={types} /></div>
        </details>
      </div>

      <Card
        title="Cari ekstresi"
        padded={false}
        actions={<div className="print:hidden"><PrintButton /></div>}
      >
        <form className="flex flex-wrap items-end gap-3 px-5 py-4 border-b border-[#2a2a2a] print:hidden">
          <div><label className={labelCls}>Başlangıç</label><input type="date" name="baslangic" defaultValue={baslangic} className={inputCls} /></div>
          <div><label className={labelCls}>Bitiş</label><input type="date" name="bitis" defaultValue={bitis} className={inputCls} /></div>
          <button className={btnSecondary}>Uygula</button>
          {(baslangic || bitis) && <Link href={`/admin/stok/cariler/${id}`} className="text-sm text-gray-500 hover:text-white py-2.5">Temizle</Link>}
        </form>
        {nonZero(opening).length > 0 && (
          <div className="px-5 py-3 text-sm text-gray-400 border-b border-[#2a2a2a]">Devreden bakiye: <Totals totals={nonZero(opening)} /></div>
        )}
        {rows.length === 0 ? <Empty>Bu aralıkta hareket yok.</Empty> : (
          <Table head={<tr><th className={thCls}>Tarih</th><th className={thCls}>İşlem</th><th className={thCls}>Belge</th><th className={thCls}>Açıklama</th><th className={`${thCls} text-right`}>Borç</th><th className={`${thCls} text-right`}>Alacak</th><th className={`${thCls} text-right`}>Bakiye</th></tr>}>
            {rows.map((e) => (
              <tr key={`${e.kind}-${e.code}`} className="hover:bg-[#111111]">
                <td className={`${tdCls} whitespace-nowrap`}>{formatDay(e.date)}</td>
                <td className={tdCls}>{e.kind}</td>
                <td className={`${tdCls} whitespace-nowrap`}><Link href={e.href} className="text-[#E4171E] hover:underline">{e.code}</Link></td>
                <td className={tdCls}>{e.note || "—"}</td>
                <td className={`${tdCls} text-right whitespace-nowrap`}>{e.debit ? formatMoney(e.debit, e.currency) : ""}</td>
                <td className={`${tdCls} text-right whitespace-nowrap`}>{e.credit ? formatMoney(e.credit, e.currency) : ""}</td>
                <td className={`${tdCls} text-right whitespace-nowrap font-semibold text-white`}>{formatMoney(e.balance, e.currency)}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
