import ActionForm from "@/components/stok/ActionForm";
import { inputCls, labelCls } from "@/components/stok/ui";
import type { ActionState } from "@/lib/stok/server";
import type { Customer } from "@/app/generated/prisma/client";

export default function CustomerForm({
  action, customer, types,
}: {
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
  customer?: Customer;
  types: string[];
}) {
  return (
    <ActionForm action={action} submitLabel={customer ? "Değişiklikleri kaydet" : "Cariyi oluştur"}>
      <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-4">
        <div>
          <label className={labelCls}>Tür</label>
          <select name="type" defaultValue={customer?.type ?? "Şahıs"} className={inputCls}>
            {types.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Ad soyad / unvan <span className="text-[#E4171E]">*</span></label>
          <input name="name" required defaultValue={customer?.name ?? ""} className={inputCls} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={labelCls}>Telefon</label>
          <input name="phone" defaultValue={customer?.phone ?? ""} className={inputCls} inputMode="tel" />
        </div>
        <div>
          <label className={labelCls}>E-posta</label>
          <input name="email" type="email" defaultValue={customer?.email ?? ""} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Yetkili kişi</label>
          <input name="contactPerson" defaultValue={customer?.contactPerson ?? ""} className={inputCls} />
        </div>
      </div>
      <div>
        <label className={labelCls}>Adres</label>
        <input name="address" defaultValue={customer?.address ?? ""} className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Notlar</label>
        <textarea name="notes" rows={2} defaultValue={customer?.notes ?? ""} className={inputCls} />
      </div>
    </ActionForm>
  );
}
