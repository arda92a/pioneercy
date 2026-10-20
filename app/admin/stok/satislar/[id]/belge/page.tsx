import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { companyInfo, saleBalance } from "@/lib/stok/queries";
import { formatDay, formatMoney } from "@/lib/stok/format";
import PrintDocument, { DocInfo, DocSection, docTd, docTh } from "@/components/stok/PrintDocument";

export default async function SaleDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const [sale, company] = await Promise.all([
    prisma.sale.findUnique({ where: { id }, include: { customer: true, lines: { include: { stockItem: true } } } }),
    companyInfo(prisma),
  ]);
  if (!sale) notFound();
  const balance = await saleBalance(prisma, id);
  const m = (v: number) => formatMoney(v, sale.currency);

  return (
    <PrintDocument company={company} title="Satış ve Garanti Belgesi" number={sale.code} date={formatDay(sale.date)}
      backHref={`/admin/stok/satislar/${id}`} backLabel="Satışa dön">
      {sale.cancelled && <div className="mb-4 border-2 border-red-600 text-red-600 font-bold text-center py-2 rounded">BU SATIŞ İPTAL EDİLMİŞTİR</div>}
      <DocSection title="Müşteri bilgileri">
        <DocInfo items={[
          ["Ad / Firma", sale.customer.name], ["Cari kodu", sale.customer.code],
          ["Telefon", sale.customer.phone], ["Araç plakası", sale.plate],
          ["Adres", sale.customer.address],
        ]} />
      </DocSection>
      <DocSection title="Satılan ürünler">
        <table className="w-full">
          <thead><tr><th className={docTh}>#</th><th className={docTh}>Stok kodu</th><th className={docTh}>Ürün</th><th className={docTh}>Adet</th><th className={`${docTh} text-right`}>Birim fiyat</th><th className={`${docTh} text-right`}>Toplam</th></tr></thead>
          <tbody>
            {sale.lines.map((l, i) => (
              <tr key={l.id}>
                <td className={docTd}>{i + 1}</td>
                <td className={docTd}>{l.stockItem.code}</td>
                <td className={docTd}><b>{l.stockItem.brand} {l.stockItem.model}</b><div className="text-xs text-gray-600">{l.name}</div></td>
                <td className={docTd}>{l.quantity}</td>
                <td className={`${docTd} text-right`}>{m(l.unitPrice)}</td>
                <td className={`${docTd} text-right`}>{m(l.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </DocSection>
      <div className="grid grid-cols-[1fr_260px] gap-8">
        <div className="text-sm">
          <div className="font-bold mb-1">Açıklama</div>
          <p className="text-gray-700">{sale.notes || "—"}</p>
          <p className="text-xs text-gray-500 mt-4">Bu belge satış ve garanti belgesi olarak düzenlenmiştir.</p>
        </div>
        <div className="text-sm space-y-1.5">
          <div className="flex justify-between"><span>Satış toplamı</span><b>{m(balance.total)}</b></div>
          <div className="flex justify-between"><span>İade</span><b>{m(balance.returned)}</b></div>
          <div className="flex justify-between"><span>Tahsilat</span><b>{m(balance.paid)}</b></div>
          <div className="flex justify-between border-t-2 border-gray-900 pt-2 text-base"><span className="font-bold">Kalan bakiye</span><b>{m(balance.remaining)}</b></div>
        </div>
      </div>
    </PrintDocument>
  );
}
