import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { listValues } from "@/lib/stok/server";
import { pickerItems, saleBalance } from "@/lib/stok/queries";
import { saveSale } from "@/lib/stok/actions/sales";
import SaleForm from "@/components/stok/SaleForm";
import { Card, Notice, PageHeader } from "@/components/stok/ui";

export default async function EditSalePage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const sale = await prisma.sale.findUnique({ where: { id }, include: { lines: true, returns: { select: { id: true } } } });
  if (!sale) notFound();
  const crumbs = [{ href: "/admin/stok/satislar", label: "Satışlar" }, { href: `/admin/stok/satislar/${id}`, label: sale.code }];

  if (sale.cancelled || sale.returns.length) {
    return (
      <div className="max-w-3xl">
        <PageHeader title={`${sale.code} düzenle`} crumbs={crumbs} />
        <Notice>
          {sale.cancelled ? "İptal edilmiş satış düzenlenemez." : "İade kaydı bulunan satış düzenlenemez; gerekirse yeni bir iade işlemi yapın."}{" "}
          <Link href={`/admin/stok/satislar/${id}`} className="underline">Satışa dön</Link>
        </Notice>
      </div>
    );
  }

  const [items, customers, currencies, methods, balance] = await Promise.all([
    pickerItems(prisma, { includeIds: sale.lines.map((l) => l.stockItemId) }),
    prisma.customer.findMany({ where: { OR: [{ active: true }, { id: sale.customerId }] }, orderBy: { name: "asc" }, select: { id: true, code: true, name: true } }),
    listValues("Para Birimi"),
    listValues("Ödeme Yöntemi"),
    saleBalance(prisma, id),
  ]);

  return (
    <div className="max-w-6xl">
      <PageHeader title={`${sale.code} düzenle`} subtitle="Eski kalemlerin stoğu geri eklenir, yeni kalemler düşülür; değişiklik geçmişe kaydedilir." crumbs={crumbs} />
      <Card>
        <SaleForm
          action={saveSale.bind(null, id)}
          items={items} customers={customers} currencies={currencies} methods={methods}
          isEdit paid={balance.paid}
          initial={{
            customerId: sale.customerId, date: sale.date, currency: sale.currency, plate: sale.plate ?? "", notes: sale.notes ?? "",
            lines: sale.lines.map((l) => ({ stockItemId: l.stockItemId, quantity: l.quantity, unitPrice: l.unitPrice })),
          }}
        />
      </Card>
    </div>
  );
}
