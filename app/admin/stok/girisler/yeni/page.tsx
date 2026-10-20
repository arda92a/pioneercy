import { prisma } from "@/lib/prisma";
import { pickerItems } from "@/lib/stok/queries";
import { saveStockReceipt } from "@/lib/stok/actions/stock";
import { todayText } from "@/lib/stok/format";
import StockReceiptForm from "@/components/stok/StockReceiptForm";
import { Card, PageHeader } from "@/components/stok/ui";

export default async function NewStockReceiptPage({ searchParams }: { searchParams: Promise<{ urun?: string }> }) {
  const { urun } = await searchParams;
  const items = await pickerItems(prisma);
  const preselected = items.find((i) => i.id === Number(urun));
  return (
    <div>
      <PageHeader title="Yeni Stok Girişi" subtitle="Kaydedince adetler stoğa eklenir ve yazdırılabilir giriş fişi oluşur."
        crumbs={[{ href: "/admin/stok/girisler", label: "Stok Girişleri" }, { href: "/admin/stok/girisler/yeni", label: "Yeni" }]} />
      <Card>
        <StockReceiptForm
          action={saveStockReceipt.bind(null, null)}
          items={items}
          initial={{ date: todayText(), note: "", lines: preselected ? [{ stockItemId: preselected.id, quantity: 1, note: null }] : [] }}
        />
      </Card>
    </div>
  );
}
