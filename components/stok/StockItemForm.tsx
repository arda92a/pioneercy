import ActionForm from "@/components/stok/ActionForm";
import { inputCls, labelCls } from "@/components/stok/ui";
import { centsToInput } from "@/lib/stok/format";
import type { ActionState } from "@/lib/stok/server";
import type { StockItem, VehicleFit } from "@/app/generated/prisma/client";

export default function StockItemForm({
  action, item, categories, brands, models,
}: {
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
  item?: StockItem & { fits: VehicleFit[] };
  categories: string[];
  brands: string[];
  models: string[];
}) {
  const fitsText = item?.fits.map((f) => [f.brand, f.model, f.yearFrom ?? "", f.yearTo ?? ""].join(" | ")).join("\n") ?? "";
  return (
    <ActionForm action={action} submitLabel={item ? "Değişiklikleri kaydet" : "Stok kartını oluştur"}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Kategori <span className="text-[#E4171E]">*</span></label>
          <input name="category" required list="stok-categories" defaultValue={item?.category ?? ""} className={inputCls} placeholder="Örn. Teyp Çerçevesi" />
        </div>
        <div>
          <label className={labelCls}>Ürün adı <span className="text-[#E4171E]">*</span></label>
          <input name="name" required defaultValue={item?.name ?? ""} className={inputCls} placeholder="Örn. OTO ÇERÇEVE" />
        </div>
        <div>
          <label className={labelCls}>Marka <span className="text-[#E4171E]">*</span></label>
          <input name="brand" required list="stok-brands" defaultValue={item?.brand ?? ""} className={inputCls} placeholder="Örn. TOYOTA" />
        </div>
        <div>
          <label className={labelCls}>Model</label>
          <input name="model" list="stok-models" defaultValue={item?.model ?? ""} className={inputCls} placeholder="Örn. COROLLA 2019" />
        </div>
      </div>

      <div>
        <div className={labelCls}>Satış fiyatları <span className="text-gray-600">(isteğe bağlı — boş bırakılırsa satışta elle girilir)</span></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(["Try", "Eur", "Usd", "Gbp"] as const).map((c) => (
            <div key={c} className="relative">
              <input
                name={`price${c}`} inputMode="decimal" placeholder="0,00"
                defaultValue={centsToInput(item?.[`price${c}`])}
                className={`${inputCls} pr-12`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">{c.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-4">
        <div>
          <label className={labelCls}>Minimum stok</label>
          <input name="minQuantity" type="number" min={0} step={1} defaultValue={item?.minQuantity ?? 0} className={inputCls} />
          <p className="text-gray-600 text-xs mt-1">Stok bu sayıya inince kritik listede görünür.</p>
        </div>
        <div>
          <label className={labelCls}>Araç uyumluluğu <span className="text-gray-600">(her satıra bir araç)</span></label>
          <textarea name="fits" rows={3} defaultValue={fitsText} className={inputCls} placeholder={"Marka | Model | Başlangıç yılı | Bitiş yılı\nToyota | Aqua | 2012 | 2019"} />
        </div>
      </div>

      {!item && <p className="text-gray-600 text-xs">Yeni kart 0 adetle açılır. Stoğu “Stok Girişi” veya karttaki “Stok düzelt” ile ekleyin.</p>}

      <datalist id="stok-categories">{categories.map((v) => <option key={v} value={v} />)}</datalist>
      <datalist id="stok-brands">{brands.map((v) => <option key={v} value={v} />)}</datalist>
      <datalist id="stok-models">{models.map((v) => <option key={v} value={v} />)}</datalist>
    </ActionForm>
  );
}
