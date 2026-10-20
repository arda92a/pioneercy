import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FileText, Pencil, Wallet } from "lucide-react";
import { returnableQuantities, saleBalance } from "@/lib/stok/queries";
import { cancelSale, returnSale } from "@/lib/stok/actions/sales";
import { formatDateTime, formatDay, formatMoney } from "@/lib/stok/format";
import ActionForm, { SubmitButton } from "@/components/stok/ActionForm";
import { Badge, Card, Notice, PageHeader, Table, btnPrimary, btnSecondary, inputCls, labelCls, tdCls, thCls } from "@/components/stok/ui";

export default async function SaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const sale = await prisma.sale.findUnique({
    where: { id },
    include: {
      customer: true, user: true,
      lines: { include: { stockItem: true } },
      returns: { include: { lines: { include: { stockItem: true } }, user: true }, orderBy: { createdAt: "asc" } },
      allocations: { include: { payment: true } },
    },
  });
  if (!sale) notFound();
  const [balance, returnable] = await Promise.all([saleBalance(prisma, id), returnableQuantities(prisma, id)]);
  const canEdit = !sale.cancelled && sale.returns.length === 0;
  const canCancel = !sale.cancelled && balance.paid === 0 && balance.returned === 0;
  const canReturn = !sale.cancelled && returnable.some((r) => r.returnable > 0);

  return (
    <div>
      <PageHeader
        title={sale.code}
        subtitle={<>{formatDay(sale.date)} · <Link href={`/admin/stok/cariler/${sale.customerId}`} className="hover:text-white underline-offset-2 hover:underline">{sale.customer.name}</Link>{sale.plate && ` · Plaka: ${sale.plate}`} {sale.cancelled && <Badge tone="red">İptal edildi</Badge>}</>}
        crumbs={[{ href: "/admin/stok/satislar", label: "Satışlar" }, { href: `/admin/stok/satislar/${id}`, label: sale.code }]}
        actions={
          <>
            <Link href={`/admin/stok/satislar/${id}/belge`} className={btnPrimary}><FileText className="w-4 h-4" /> Satış belgesi</Link>
            {!sale.cancelled && balance.remaining > 0 && (
              <Link href={`/admin/stok/tahsilatlar/yeni?cari=${sale.customerId}&satis=${id}`} className={btnSecondary}><Wallet className="w-4 h-4" /> Tahsilat al</Link>
            )}
            {canEdit && <Link href={`/admin/stok/satislar/${id}/duzenle`} className={btnSecondary}><Pencil className="w-4 h-4" /> Düzenle</Link>}
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          ["Satış toplamı", balance.total], ["İade", balance.returned], ["Tahsil edilen", balance.paid], ["Kalan", balance.remaining],
        ].map(([label, value]) => (
          <div key={label} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
            <div className="text-gray-500 text-xs mb-1">{label}</div>
            <div className={`text-xl font-black ${label === "Kalan" && Number(value) > 0 ? "text-amber-400" : "text-white"}`}>{formatMoney(Number(value), sale.currency)}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
        <div className="space-y-6">
          <Card title="Satış kalemleri" padded={false}>
            <Table head={<tr><th className={thCls}>Ürün</th><th className={thCls}>Adet</th><th className={`${thCls} text-right`}>Birim fiyat</th><th className={`${thCls} text-right`}>Toplam</th></tr>}>
              {sale.lines.map((l) => (
                <tr key={l.id}>
                  <td className={tdCls}>
                    <Link href={`/admin/stok/kartlar/${l.stockItemId}`} className="text-white hover:text-[#E4171E]">{l.stockItem.brand} {l.stockItem.model}</Link>
                    <div className="text-gray-600 text-xs">{l.stockItem.code} · {l.name}</div>
                  </td>
                  <td className={tdCls}>{l.quantity}</td>
                  <td className={`${tdCls} text-right`}>{formatMoney(l.unitPrice, sale.currency)}</td>
                  <td className={`${tdCls} text-right text-white font-semibold`}>{formatMoney(l.lineTotal, sale.currency)}</td>
                </tr>
              ))}
            </Table>
            {sale.notes && <div className="px-5 py-3 border-t border-[#2a2a2a] text-sm text-gray-400">Not: {sale.notes}</div>}
            <div className="px-5 py-3 border-t border-[#2a2a2a] text-xs text-gray-600">
              Oluşturan: {sale.user?.username ?? "—"} · {formatDateTime(sale.createdAt)}
              {sale.updatedAt.getTime() - sale.createdAt.getTime() > 1000 && <> · Son değişiklik: {formatDateTime(sale.updatedAt)}</>}
            </div>
          </Card>

          <Card title="Bağlı tahsilatlar" padded={false}>
            {sale.allocations.length === 0 ? <div className="px-5 py-4 text-sm text-gray-600">Bu satışa bağlı tahsilat yok.</div> : (
              <Table head={<tr><th className={thCls}>Makbuz</th><th className={thCls}>Tarih</th><th className={thCls}>Yöntem</th><th className={`${thCls} text-right`}>Satışa düşen</th></tr>}>
                {sale.allocations.map((a) => (
                  <tr key={a.id}>
                    <td className={tdCls}><Link href={`/admin/stok/tahsilatlar/${a.paymentId}/makbuz`} className="text-[#E4171E] hover:underline">{a.payment.code}</Link></td>
                    <td className={tdCls}>{formatDay(a.payment.date)}</td>
                    <td className={tdCls}>{a.payment.method}</td>
                    <td className={`${tdCls} text-right`}>{formatMoney(a.amount, sale.currency)}</td>
                  </tr>
                ))}
              </Table>
            )}
          </Card>

          {sale.returns.length > 0 && (
            <Card title="İadeler" padded={false}>
              <Table head={<tr><th className={thCls}>İade</th><th className={thCls}>Tarih</th><th className={thCls}>Ürünler</th><th className={`${thCls} text-right`}>Tutar</th></tr>}>
                {sale.returns.map((r) => (
                  <tr key={r.id}>
                    <td className={tdCls}>{r.code}{r.note && <div className="text-gray-600 text-xs">{r.note}</div>}</td>
                    <td className={tdCls}>{formatDay(r.date)}<div className="text-gray-600 text-xs">{r.user?.username}</div></td>
                    <td className={tdCls}>{r.lines.map((l) => <div key={l.id}>{l.stockItem.brand} {l.stockItem.model} × {l.quantity}</div>)}</td>
                    <td className={`${tdCls} text-right`}>{formatMoney(r.total, r.currency)}</td>
                  </tr>
                ))}
              </Table>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {canReturn && (
            <Card title="İade al">
              <ActionForm action={returnSale.bind(null, id)} className="space-y-4" confirmText="İade kaydedilsin mi? Ürünler stoğa geri eklenecek.">

                {returnable.map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-3">
                    <div className="text-sm min-w-0">
                      <div className="text-white truncate">{r.stockItem.brand} {r.stockItem.model}</div>
                      <div className="text-gray-600 text-xs">Satılan {r.quantity}{r.alreadyReturned > 0 && `, iade edilen ${r.alreadyReturned}`}</div>
                    </div>
                    <input name={`qty_${r.stockItemId}`} type="number" min={0} max={r.returnable} defaultValue={0} disabled={r.returnable === 0}
                      className={`${inputCls} !w-20`} aria-label="İade adedi" />
                  </div>
                ))}
                <div>
                  <label className={labelCls}>Açıklama</label>
                  <input name="note" className={inputCls} placeholder="İade nedeni" />
                </div>
                <p className="text-gray-600 text-xs">İade edilen ürünler stoğa geri eklenir, tutar satış bakiyesinden düşer.</p>
                <div className="flex justify-end"><SubmitButton className={btnSecondary}>İadeyi kaydet</SubmitButton></div>
              </ActionForm>
            </Card>
          )}

          {!sale.cancelled && (
            <Card title="Satışı iptal et">
              {canCancel ? (
                <ActionForm action={cancelSale.bind(null, id)} className="space-y-3" confirmText={`${sale.code} iptal edilsin mi? Ürünler stoğa geri eklenecek.`}>
                  <p className="text-sm text-gray-400">İptal edilen satışın ürünleri stoğa geri eklenir; kayıt geçmişte “İptal” olarak kalır.</p>
                  <SubmitButton className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl border border-red-900/60 text-red-400 hover:bg-red-950/40 transition-colors">
                    Satışı iptal et
                  </SubmitButton>
                </ActionForm>
              ) : (
                <Notice tone="yellow">Tahsilat veya iade kaydı bulunan satış doğrudan iptal edilemez. Ürün geri geldiyse “İade al” kullanın.</Notice>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
