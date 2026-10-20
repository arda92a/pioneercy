import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { pickerItems } from "@/lib/stok/queries";
import { saveStockReceipt } from "@/lib/stok/actions/stock";
import StockReceiptForm from "@/components/stok/StockReceiptForm";
import { Card, PageHeader } from "@/components/stok/ui";

export default async function EditStockReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const receipt = await prisma.stockReceipt.findUnique({ where: { id }, include: { lines: true } });
  if (!receipt) notFound();
  const items = await pickerItems(prisma, { includeIds: receipt.lines.map((l) => l.stockItemId) });
  return (
    <div>
      <PageHeader
        title={`${receipt.code} düzenle`}
        subtitle="Adetleri değiştirirseniz stok farkı otomatik düzeltilir ve hareket geçmişine yazılır."
        crumbs={[{ href: "/admin/stok/girisler", label: "Stok Girişleri" }, { href: `/admin/stok/girisler/${id}`, label: receipt.code }]}
      />
      <Card>
        <StockReceiptForm
          action={saveStockReceipt.bind(null, id)}
          items={items}
          isEdit
          initial={{ date: receipt.date, note: receipt.note ?? "", lines: receipt.lines }}
        />
      </Card>
    </div>
  );
}
