"use client";
import { useState } from "react";
import { Plus, X } from "lucide-react";
import ActionForm from "@/components/stok/ActionForm";
import ItemPicker, { type PickerItem } from "@/components/stok/ItemPicker";
import { btnSmall, inputCls, labelCls } from "@/components/stok/ui";
import type { ActionState } from "@/lib/stok/server";

type Line = { key: number; stockItemId: number | null; quantity: string; note: string };

export default function StockReceiptForm({
  action, items, initial, isEdit = false,
}: {
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
  items: PickerItem[];
  isEdit?: boolean;
  initial: { date: string; note: string; lines: { stockItemId: number; quantity: number; note: string | null }[] };
}) {
  const [lines, setLines] = useState<Line[]>(() =>
    initial.lines.length
      ? initial.lines.map((l, i) => ({ key: i, stockItemId: l.stockItemId, quantity: String(l.quantity), note: l.note ?? "" }))
      : [{ key: 0, stockItemId: null, quantity: "1", note: "" }],
  );
  const update = (key: number, patch: Partial<Line>) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  const addLine = () => setLines((ls) => [...ls, { key: Math.max(0, ...ls.map((l) => l.key)) + 1, stockItemId: null, quantity: "1", note: "" }]);
  const totalUnits = lines.reduce((s, l) => s + (l.stockItemId ? Number(l.quantity) || 0 : 0), 0);
  const payload = JSON.stringify(lines.filter((l) => l.stockItemId).map((l) => ({ stockItemId: l.stockItemId, quantity: Number(l.quantity), note: l.note })));

  return (
    <ActionForm action={action} submitLabel="Stok girişini kaydet">
      <input type="hidden" name="lines" value={payload} />
      <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-4">
        <div>
          <label className={labelCls}>Tarih</label>
          <input type="date" name="date" defaultValue={initial.date} required className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Açıklama</label>
          <input name="note" defaultValue={initial.note} className={inputCls} placeholder="Örn. tedarikçi / irsaliye no" />
        </div>
      </div>

      <div className="space-y-3">
        <div className="hidden md:grid grid-cols-[1fr_110px_110px_1fr_36px] gap-3 text-xs text-gray-500 uppercase tracking-wide">
          <span>Ürün</span><span>Mevcut</span><span>Giriş adedi</span><span>Satır notu</span><span />
        </div>
        {lines.map((l) => {
          const item = items.find((i) => i.id === l.stockItemId);
          return (
            <div key={l.key} className="grid grid-cols-1 md:grid-cols-[1fr_110px_110px_1fr_36px] gap-3 items-center border-b border-[#2a2a2a] md:border-0 pb-3 md:pb-0">
              <ItemPicker items={items} value={l.stockItemId} onChange={(id) => update(l.key, { stockItemId: id })}
                excludeIds={lines.filter((x) => x.key !== l.key && x.stockItemId).map((x) => x.stockItemId!)} />
              <div className="text-sm text-gray-400">
                {!item ? "—" : isEdit ? `${item.quantity} adet` : `${item.quantity} → ${item.quantity + (Number(l.quantity) || 0)}`}
              </div>
              <input type="number" min={1} step={1} value={l.quantity} onChange={(e) => update(l.key, { quantity: e.target.value })} className={inputCls} />
              <input value={l.note} onChange={(e) => update(l.key, { note: e.target.value })} className={inputCls} placeholder="İsteğe bağlı" />
              <button type="button" onClick={() => setLines((ls) => (ls.length > 1 ? ls.filter((x) => x.key !== l.key) : ls))}
                className="p-2 text-gray-500 hover:text-red-400 rounded-lg" aria-label="Satırı sil">
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
        <div className="flex items-center justify-between">
          <button type="button" onClick={addLine} className={btnSmall}><Plus className="w-3.5 h-3.5" /> Ürün satırı ekle</button>
          <div className="text-sm text-gray-400">Toplam giriş: <span className="text-white font-bold">{totalUnits} adet</span></div>
        </div>
      </div>
    </ActionForm>
  );
}
