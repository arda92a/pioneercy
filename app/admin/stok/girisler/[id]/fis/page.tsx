import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { companyInfo } from "@/lib/stok/queries";
import { formatDay } from "@/lib/stok/format";
import PrintDocument, { DocInfo, DocSection, docTd, docTh } from "@/components/stok/PrintDocument";

export default async function StockReceiptSlipPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const [receipt, company] = await Promise.all([
    prisma.stockReceipt.findUnique({ where: { id }, include: { lines: { include: { stockItem: true } }, user: true } }),
    companyInfo(prisma),
  ]);
  if (!receipt) notFound();

  return (
    <PrintDocument company={company} title="Stok Giriş Fişi" number={receipt.code} date={formatDay(receipt.date)}
      backHref="/admin/stok/girisler" backLabel="Stok girişlerine dön">
      <DocSection title="Fiş bilgileri">
        <DocInfo items={[["Tarih", formatDay(receipt.date)], ["Hazırlayan", receipt.user?.name ?? receipt.user?.username], ["Açıklama", receipt.note]]} />
      </DocSection>
      <DocSection title="Giren ürünler">
        <table className="w-full">
          <thead><tr><th className={docTh}>#</th><th className={docTh}>Stok kodu</th><th className={docTh}>Ürün</th><th className={docTh}>Adet</th><th className={docTh}>Not</th></tr></thead>
          <tbody>
            {receipt.lines.map((l, i) => (
              <tr key={l.id}>
                <td className={docTd}>{i + 1}</td>
                <td className={docTd}>{l.stockItem.code}</td>
                <td className={docTd}><b>{l.stockItem.brand} {l.stockItem.model}</b><div className="text-xs text-gray-600">{l.stockItem.name}</div></td>
                <td className={docTd}>{l.quantity}</td>
                <td className={docTd}>{l.note ?? ""}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr><td colSpan={3} className="text-right text-sm font-bold py-2 pr-3">Toplam</td><td className="text-sm font-bold py-2">{receipt.lines.reduce((s, l) => s + l.quantity, 0)}</td><td /></tr>
          </tfoot>
        </table>
      </DocSection>
      <div className="grid grid-cols-2 gap-10 mt-12 text-sm">
        <div className="border-t border-gray-400 pt-2 text-gray-600">Teslim eden</div>
        <div className="border-t border-gray-400 pt-2 text-gray-600">Teslim alan</div>
      </div>
    </PrintDocument>
  );
}
