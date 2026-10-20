import { listValues } from "@/lib/stok/server";
import { saveStockItem } from "@/lib/stok/actions/stock";
import StockItemForm from "@/components/stok/StockItemForm";
import { Card, PageHeader } from "@/components/stok/ui";

export default async function NewStockItemPage() {
  const [categories, brands, models] = await Promise.all([
    listValues("Ürün Kategorisi"), listValues("Ürün Markası"), listValues("Ürün Modeli"),
  ]);
  return (
    <div className="max-w-3xl">
      <PageHeader title="Yeni Stok Kartı" crumbs={[{ href: "/admin/stok/kartlar", label: "Stok Kartları" }, { href: "/admin/stok/kartlar/yeni", label: "Yeni" }]} />
      <Card>
        <StockItemForm action={saveStockItem.bind(null, null)} categories={categories} brands={brands} models={models} />
      </Card>
    </div>
  );
}
