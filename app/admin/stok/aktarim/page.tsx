import { prisma } from "@/lib/prisma";
import { Download } from "lucide-react";
import ActionForm from "@/components/stok/ActionForm";
import { importExcel } from "@/lib/stok/actions/settings";
import { formatDateTime } from "@/lib/stok/format";
import { Badge, Card, Empty, PageHeader, Table, btnSmall, inputCls, labelCls, tdCls, thCls } from "@/components/stok/ui";

export default async function ImportPage() {
  const logs = await prisma.importLog.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  return (
    <div>
      <PageHeader
        title="Excel Aktarım"
        subtitle="Stok kartlarını veya carileri Excel dosyasından toplu ekleyin."
        crumbs={[{ href: "/admin/stok/aktarim", label: "Excel Aktarım" }]}
      />
      <div className="grid lg:grid-cols-[1fr_360px] gap-6 mb-6">
        <Card title="Dosya yükle">
          <ActionForm action={importExcel} encType="multipart/form-data" resetOnSuccess submitLabel="Aktarımı başlat">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Aktarım türü</label>
                <select name="kind" className={inputCls} defaultValue="stok">
                  <option value="stok">Stok kartları</option>
                  <option value="cari">Cariler</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Excel dosyası (.xlsx)</label>
                <input type="file" name="file" accept=".xlsx" required className={`${inputCls} file:mr-3 file:border-0 file:bg-[#2a2a2a] file:text-white file:rounded-lg file:px-3 file:py-1`} />
              </div>
            </div>
          </ActionForm>
        </Card>
        <Card title="Nasıl çalışır?">
          <ul className="text-sm text-gray-400 space-y-2 list-disc pl-4">
            <li>Önce şablonu indirin; ilk satırdaki başlıkları değiştirmeyin.</li>
            <li>Aynı marka + model + ürün adına sahip stok kartları ve aynı ad + telefona sahip cariler <b className="text-white">atlanır</b>, mevcut kayıtlar değişmez.</li>
            <li>Stoktaki <code>mevcut_stok</code> değeri &quot;Excel açılış stoğu&quot; hareketi olarak işlenir.</li>
            <li>Araç uyumluluğu her satıra bir araç: <code>Marka | Model | Yıl1 | Yıl2</code></li>
          </ul>
          <div className="flex flex-wrap gap-2 mt-4">
            <a href="/admin/stok/aktarim/sablon/stok" download className={btnSmall}><Download className="w-3.5 h-3.5" /> Stok şablonu</a>
            <a href="/admin/stok/aktarim/sablon/cari" download className={btnSmall}><Download className="w-3.5 h-3.5" /> Cari şablonu</a>
          </div>
        </Card>
      </div>
      <Card title="Aktarım geçmişi" padded={false}>
        {logs.length === 0 ? <Empty>Henüz aktarım yapılmadı.</Empty> : (
          <Table head={<tr><th className={thCls}>Tarih</th><th className={thCls}>Dosya</th><th className={thCls}>Tür</th><th className={thCls}>Eklenen</th><th className={thCls}>Atlanan</th></tr>}>
            {logs.map((l) => (
              <tr key={l.id}>
                <td className={`${tdCls} whitespace-nowrap`}>{formatDateTime(l.createdAt)}</td>
                <td className={tdCls}>{l.fileName}</td>
                <td className={tdCls}>{l.kind === "stok" ? "Stok" : l.kind === "cari" ? "Cari" : l.kind}</td>
                <td className={tdCls}><Badge tone="green">{l.added}</Badge></td>
                <td className={tdCls}><Badge tone={l.skipped ? "yellow" : "gray"}>{l.skipped}</Badge></td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
