import { listValues } from "@/lib/stok/server";
import { saveCustomer } from "@/lib/stok/actions/sales";
import CustomerForm from "@/components/stok/CustomerForm";
import { Card, PageHeader } from "@/components/stok/ui";

export default async function NewCustomerPage() {
  const types = await listValues("Cari Türü");
  return (
    <div className="max-w-3xl">
      <PageHeader title="Yeni Cari" crumbs={[{ href: "/admin/stok/cariler", label: "Cariler" }, { href: "/admin/stok/cariler/yeni", label: "Yeni" }]} />
      <Card><CustomerForm action={saveCustomer.bind(null, null)} types={types} /></Card>
    </div>
  );
}
