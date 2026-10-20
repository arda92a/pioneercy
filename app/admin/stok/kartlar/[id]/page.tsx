import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { listValues } from "@/lib/stok/server";
import { adjustStock, saveStockItem, toggleStockItem } from "@/lib/stok/actions/stock";
import { formatDateTime } from "@/lib/stok/format";
import StockItemForm from "@/components/stok/StockItemForm";
import ActionForm, { ActionButton } from "@/components/stok/ActionForm";
import { Badge, Card, Empty, Notice, PageHeader, Table, btnSecondary, inputCls, labelCls, tdCls, thCls } from "@/components/stok/ui";

export default async function StockItemPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ kaydedildi?: string }>;
}) {
  const id = Number((await params).id);
  const { kaydedildi } = await searchParams;
  const item = await prisma.stockItem.findUnique({ where: { id }, include: { fits: true } });
  if (!item) notFound();

  const [categories, brands, models, movements] = await Promise.all([
    listValues("Ürün Kategorisi"), listValues("Ürün Markası"), listValues("Ürün Modeli"),
    prisma.stockMovement.findMany({ where: { stockItemId: id }, include: { user: true }, orderBy: [{ date: "desc" }, { id: "desc" }] }),
  ]);

  const refs = [...new Set(movements.map((m) => m.ref))];
  const [sales, receipts, returns] = await Promise.all([
    prisma.sale.findMany({ where: { code: { in: refs } }, select: { id: true, code: true } }),
    prisma.stockReceipt.findMany({ where: { code: { in: refs } }, select: { id: true, code: true } }),
    prisma.saleReturn.findMany({ where: { code: { in: refs } }, select: { saleId: true, code: true } }),
  ]);
  const refHref = new Map<string, string>([
    ...sales.map((s) => [s.code, `/admin/stok/satislar/${s.id}`] as [string, string]),
    ...receipts.map((r) => [r.code, `/admin/stok/girisler/${r.id}/fis`] as [string, string]),
    ...returns.map((r) => [r.code, `/admin/stok/satislar/${r.saleId}`] as [string, string]),
  ]);

  return (
    <div>
      <PageHeader
        title={`${item.brand} ${item.model}`.trim()}
        subtitle={<>{item.code} · {item.name} · {item.category} {!item.active && <Badge>Pasif</Badge>}</>}
        crumbs={[{ href: "/admin/stok/kartlar", label: "Stok Kartları" }, { href: `/admin/stok/kartlar/${id}`, label: item.code }]}
        actions={
          <ActionButton
            action={toggleStockItem.bind(null, id)}
            className={btnSecondary}
            confirmText={item.active ? "Kart pasife alınsın mı? Pasif kartlar satış ve girişlerde görünmez." : undefined}
          >
            {item.active ? "Pasife al" : "Aktifleştir"}
          </ActionButton>
        }
      />
      {kaydedildi && <div className="mb-5"><Notice tone="green">Stok kartı kaydedildi.</Notice></div>}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6 mb-6">
        <Card title="Kart bilgileri">
          <StockItemForm action={saveStockItem.bind(null, id)} item={item} categories={categories} brands={brands} models={models} />
        </Card>

        <div className="space-y-6">
          <Card title="Mevcut stok">
            <div className="text-4xl font-black text-white">{item.quantity} <span className="text-base font-medium text-gray-500">adet</span></div>
            {item.quantity <= item.minQuantity && <div className="mt-2"><Badge tone={item.quantity === 0 ? "red" : "yellow"}>Kritik seviye (min. {item.minQuantity})</Badge></div>}
          </Card>
          <Card title="Stok düzelt (sayım)">
            <ActionForm action={adjustStock.bind(null, id)} submitLabel="Düzeltmeyi kaydet" resetOnSuccess className="space-y-4">
              <div>
                <label className={labelCls}>Yeni miktar</label>
                <input name="newQuantity" type="number" min={0} step={1} required className={inputCls} placeholder={String(item.quantity)} />
              </div>
              <div>
                <label className={labelCls}>Neden <span className="text-[#E4171E]">*</span></label>
                <input name="reason" required className={inputCls} placeholder="Örn. 20/10/2026 sayımı" />
              </div>
              <p className="text-gray-600 text-xs">Fark stok hareketlerine “Manuel düzeltme” olarak yazılır.</p>
            </ActionForm>
          </Card>
        </div>
      </div>

      <Card title={`Stok hareketleri (${movements.length})`} padded={false}>
        {movements.length === 0 ? <Empty>Hareket yok.</Empty> : (
          <Table head={<tr><th className={thCls}>Tarih</th><th className={thCls}>İşlem</th><th className={thCls}>Belge</th><th className={thCls}>Miktar</th><th className={thCls}>Açıklama</th><th className={thCls}>Kullanıcı</th></tr>}>
            {movements.map((m) => (
              <tr key={m.id} className="hover:bg-[#111111]">
                <td className={`${tdCls} whitespace-nowrap`}>{formatDateTime(m.date)}</td>
                <td className={tdCls}>{m.type}</td>
                <td className={`${tdCls} whitespace-nowrap`}>
                  {refHref.has(m.ref) ? <Link href={refHref.get(m.ref)!} className="text-[#E4171E] hover:underline">{m.ref}</Link> : m.ref}
                </td>
                <td className={tdCls}><span className={m.quantity > 0 ? "text-emerald-400 font-semibold" : "text-red-400 font-semibold"}>{m.quantity > 0 ? `+${m.quantity}` : m.quantity}</span></td>
                <td className={tdCls}>{m.note ?? "—"}</td>
                <td className={tdCls}>{m.user?.username ?? "—"}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
