import { prisma } from "@/lib/prisma";
import { listValues } from "@/lib/stok/server";
import { pickerItems } from "@/lib/stok/queries";
import { saveSale } from "@/lib/stok/actions/sales";
import { todayText } from "@/lib/stok/format";
import SaleForm from "@/components/stok/SaleForm";
import { Card, PageHeader } from "@/components/stok/ui";

export default async function NewSalePage({ searchParams }: { searchParams: Promise<{ cari?: string }> }) {
  const { cari } = await searchParams;
  const [items, customers, currencies, methods] = await Promise.all([
    pickerItems(prisma),
    prisma.customer.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, code: true, name: true } }),
    listValues("Para Birimi"),
    listValues("Ödeme Yöntemi"),
  ]);
  const generic = customers.find((c) => c.name.toLocaleLowerCase("tr").startsWith("genel"));
  return (
    <div>
      <PageHeader title="Yeni Satış" subtitle="Stok yetersizse satış kaydedilmez. Fiyat, ürün kartındaki fiyattan gelir; satırda değiştirilebilir."
        crumbs={[{ href: "/admin/stok/satislar", label: "Satışlar" }, { href: "/admin/stok/satislar/yeni", label: "Yeni" }]} />
      <Card>
        <SaleForm
          action={saveSale.bind(null, null)}
          items={items} customers={customers} currencies={currencies} methods={methods}
          initial={{ customerId: Number(cari) || generic?.id || null, date: todayText(), currency: "TRY", plate: "", notes: "", lines: [] }}
        />
      </Card>
    </div>
  );
}
