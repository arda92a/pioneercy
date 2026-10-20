import { prisma } from "@/lib/prisma";
import ActionForm, { ActionButton } from "@/components/stok/ActionForm";
import { saveSettings, toggleListValue } from "@/lib/stok/actions/settings";
import { LIST_DEFAULTS } from "@/lib/stok/server";
import { companyInfo } from "@/lib/stok/queries";
import { Card, PageHeader, inputCls, labelCls } from "@/components/stok/ui";

const GROUPS = ["Para Birimi", "Ödeme Yöntemi", "Ürün Kategorisi", "Cari Türü"];

export default async function StockSettingsPage() {
  const [company, values] = await Promise.all([
    companyInfo(prisma),
    prisma.stockListValue.findMany({ where: { group: { in: GROUPS } } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Stok Ayarları"
        subtitle="Belgelerde görünen şirket bilgisi ve formlardaki seçim listeleri."
        crumbs={[{ href: "/admin/stok/ayarlar", label: "Ayarlar" }]}
      />
      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="Şirket ve yeni liste değerleri">
          <ActionForm action={saveSettings} encType="multipart/form-data" submitLabel="Kaydet">
            <div>
              <label className={labelCls}>Belgelerdeki şirket adı</label>
              <input name="companyName" defaultValue={company.name} required className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Logo (PNG, JPG, WEBP — en fazla 2 MB)</label>
              <div className="flex items-center gap-4">
                {company.logo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={company.logo} alt="Logo" className="h-14 w-auto bg-white rounded-lg p-1" />
                )}
                <input type="file" name="logo" accept=".png,.jpg,.jpeg,.webp" className={`${inputCls} file:mr-3 file:border-0 file:bg-[#2a2a2a] file:text-white file:rounded-lg file:px-3 file:py-1`} />
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Yeni para birimi</label>
                <input name="newCurrency" placeholder="ör. CHF" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Yeni ödeme yöntemi</label>
                <input name="newMethod" placeholder="ör. Çek" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Yeni ürün kategorisi</label>
                <input name="newCategory" placeholder="ör. Hoparlör" className={inputCls} />
              </div>
            </div>
          </ActionForm>
        </Card>

        <Card title="Seçim listeleri">
          <p className="text-xs text-gray-600 mb-4">Pasif değerler yeni kayıtlarda seçilemez; eski kayıtlar etkilenmez.</p>
          <div className="space-y-5">
            {GROUPS.map((group) => {
              const rows = values.filter((v) => v.group === group).sort((a, b) => a.value.localeCompare(b.value, "tr"));
              return (
                <div key={group}>
                  <div className="text-sm font-semibold text-white mb-2">{group}</div>
                  {rows.length === 0 ? (
                    <div className="text-xs text-gray-600">Varsayılanlar kullanılıyor: {LIST_DEFAULTS[group]?.join(", ")}</div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {rows.map((v) => (
                        <ActionButton key={v.id} action={toggleListValue.bind(null, v.id)}
                          className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${v.active ? "border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10" : "border-[#3a3a3a] text-gray-600 line-through hover:text-gray-400"}`}>
                          {v.value}
                        </ActionButton>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-600 mt-4">Bir değere tıklayarak aktif/pasif yapabilirsiniz.</p>
        </Card>
      </div>
    </div>
  );
}
