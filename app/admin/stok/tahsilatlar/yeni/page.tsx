import { prisma } from "@/lib/prisma";
import { listValues } from "@/lib/stok/server";
import { saleBalances } from "@/lib/stok/queries";
import { createPayment } from "@/lib/stok/actions/sales";
import { todayText } from "@/lib/stok/format";
import PaymentForm from "@/components/stok/PaymentForm";
import { Card, PageHeader } from "@/components/stok/ui";

export default async function NewPaymentPage({ searchParams }: { searchParams: Promise<{ cari?: string; satis?: string }> }) {
  const { cari, satis } = await searchParams;
  const [customers, currencies, methods, sales] = await Promise.all([
    prisma.customer.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, code: true, name: true } }),
    listValues("Para Birimi"),
    listValues("Ödeme Yöntemi"),
    prisma.sale.findMany({ where: { cancelled: false }, select: { id: true, code: true, date: true, customerId: true, currency: true, total: true } }),
  ]);
  const balanceOf = await saleBalances(prisma, sales.map((s) => s.id));
  const openSales = sales.map((s) => ({ ...s, remaining: balanceOf(s.id, s.total).remaining })).filter((s) => s.remaining > 0);

  return (
    <div>
      <PageHeader title="Yeni Tahsilat" subtitle="Tahsilat yalnızca aynı para birimindeki satışlara bağlanabilir; para birimleri arasında dönüşüm yapılmaz."
        crumbs={[{ href: "/admin/stok/tahsilatlar", label: "Tahsilatlar" }, { href: "/admin/stok/tahsilatlar/yeni", label: "Yeni" }]} />
      <Card>
        <PaymentForm
          action={createPayment}
          customers={customers} currencies={currencies} methods={methods} openSales={openSales}
          initial={{ customerId: Number(cari) || null, currency: "TRY", date: todayText(), saleId: Number(satis) || null }}
        />
      </Card>
    </div>
  );
}
