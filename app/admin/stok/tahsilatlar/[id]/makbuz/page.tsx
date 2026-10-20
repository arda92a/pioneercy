import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { addTo, companyInfo, nonZero, saleBalance, type CurrencyTotals } from "@/lib/stok/queries";
import { formatDay, formatMoney } from "@/lib/stok/format";
import PrintDocument, { DocInfo, DocSection, docTd, docTh } from "@/components/stok/PrintDocument";

const ORDER = { sale: 0, ret: 1, pay: 2 };

export default async function PaymentReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const [payment, company] = await Promise.all([
    prisma.payment.findUnique({ where: { id }, include: { customer: true, user: true, allocations: { include: { sale: true } } } }),
    companyInfo(prisma),
  ]);
  if (!payment) notFound();

  const customerId = payment.customerId;
  const [sales, returns, payments] = await Promise.all([
    prisma.sale.findMany({ where: { customerId, cancelled: false }, select: { date: true, code: true, currency: true, total: true } }),
    prisma.saleReturn.findMany({ where: { sale: { customerId, cancelled: false } }, select: { date: true, code: true, currency: true, total: true } }),
    prisma.payment.findMany({ where: { customerId }, select: { date: true, code: true, currency: true, amount: true } }),
  ]);
  const events = [
    ...sales.map((s) => ({ date: s.date, kind: "sale" as const, code: s.code, currency: s.currency, delta: s.total })),
    ...returns.map((r) => ({ date: r.date, kind: "ret" as const, code: r.code, currency: r.currency, delta: -r.total })),
    ...payments.map((p) => ({ date: p.date, kind: "pay" as const, code: p.code, currency: p.currency, delta: -p.amount })),
  ].sort((a, b) => a.date.localeCompare(b.date) || ORDER[a.kind] - ORDER[b.kind] || a.code.localeCompare(b.code));
  const before: CurrencyTotals = {};
  for (const e of events) {
    if (e.kind === "pay" && e.code === payment.code) break;
    addTo(before, e.currency, e.delta);
  }
  const after = { ...before };
  addTo(after, payment.currency, -payment.amount);
  const remaining = await Promise.all(payment.allocations.map((a) => saleBalance(prisma, a.saleId)));
  const show = (t: CurrencyTotals) => nonZero(t).map(([c, v]) => formatMoney(v, c)).join(" · ") || "0,00";

  return (
    <PrintDocument company={company} title="Tahsilat Makbuzu" number={payment.code} date={formatDay(payment.date)}
      backHref="/admin/stok/tahsilatlar" backLabel="Tahsilatlara dön">
      <DocSection title="Ödeyen">
        <DocInfo items={[
          ["Ad / Firma", payment.customer.name], ["Cari kodu", payment.customer.code],
          ["Telefon", payment.customer.phone], ["Ödeme yöntemi", payment.method],
        ]} />
      </DocSection>
      <div className="border-2 border-gray-900 rounded-lg p-5 mb-6 flex items-center justify-between">
        <div className="text-sm text-gray-600">Tahsil edilen tutar</div>
        <div className="text-3xl font-black">{formatMoney(payment.amount, payment.currency)}</div>
      </div>
      {payment.note && <p className="text-sm mb-6"><b>Açıklama:</b> {payment.note}</p>}
      {payment.allocations.length > 0 && (
        <DocSection title="Ödemenin bağlandığı satışlar">
          <table className="w-full">
            <thead><tr><th className={docTh}>Satış</th><th className={docTh}>Tarih</th><th className={`${docTh} text-right`}>Satışa düşen</th><th className={`${docTh} text-right`}>Satışın güncel kalanı</th></tr></thead>
            <tbody>
              {payment.allocations.map((a, i) => (
                <tr key={a.id}>
                  <td className={docTd}>{a.sale.code}</td>
                  <td className={docTd}>{formatDay(a.sale.date)}</td>
                  <td className={`${docTd} text-right`}>{formatMoney(a.amount, payment.currency)}</td>
                  <td className={`${docTd} text-right`}>{formatMoney(remaining[i].remaining, payment.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DocSection>
      )}
      <DocSection title="Cari hesap">
        <DocInfo items={[["Tahsilat öncesi bakiye", show(before)], ["Tahsilat sonrası bakiye", show(after)]]} />
      </DocSection>
      <div className="grid grid-cols-2 gap-10 mt-12 text-sm">
        <div className="border-t border-gray-400 pt-2 text-gray-600">Teslim alan: {payment.user?.name ?? payment.user?.username ?? ""}</div>
        <div className="border-t border-gray-400 pt-2 text-gray-600">Ödeyen</div>
      </div>
    </PrintDocument>
  );
}
