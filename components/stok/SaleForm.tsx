"use client";
import { useState } from "react";
import { Plus, X } from "lucide-react";
import ActionForm from "@/components/stok/ActionForm";
import ItemPicker, { type PickerItem } from "@/components/stok/ItemPicker";
import { btnSmall, inputCls, labelCls } from "@/components/stok/ui";
import { centsToInput, formatMoney, parseMoney } from "@/lib/stok/format";
import type { ActionState } from "@/lib/stok/server";

type Line = { key: number; stockItemId: number | null; quantity: string; unitPrice: string };

function safeMoney(text: string): number | null {
  try { return parseMoney(text); } catch { return null; }
}

export default function SaleForm({
  action, items, customers, currencies, methods, initial, isEdit = false, paid = 0,
}: {
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
  items: PickerItem[];
  customers: { id: number; code: string; name: string }[];
  currencies: string[];
  methods: string[];
  initial: {
    customerId: number | null; date: string; currency: string; plate: string; notes: string;
    lines: { stockItemId: number; quantity: number; unitPrice: number }[];
  };
  isEdit?: boolean;
  paid?: number;
}) {
  const [currency, setCurrency] = useState(initial.currency);
  const [firstPayment, setFirstPayment] = useState("");
  const [lines, setLines] = useState<Line[]>(() =>
    initial.lines.length
      ? initial.lines.map((l, i) => ({ key: i, stockItemId: l.stockItemId, quantity: String(l.quantity), unitPrice: centsToInput(l.unitPrice) }))
      : [{ key: 0, stockItemId: null, quantity: "1", unitPrice: "" }],
  );
  // Düzenlemede eski satırdaki adetler stoğa geri eklenmiş gibi gösterilir.
  const reserved = new Map(isEdit ? initial.lines.map((l) => [l.stockItemId, l.quantity]) : []);

  const priceOf = (id: number | null, cur: string) => {
    const p = items.find((i) => i.id === id)?.prices[cur];
    return p === null || p === undefined ? "" : centsToInput(p);
  };
  const update = (key: number, patch: Partial<Line>) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  const changeCurrency = (cur: string) => {
    setLines((ls) => ls.map((l) => {
      const wasAuto = l.unitPrice !== "" && l.unitPrice === priceOf(l.stockItemId, currency);
      return { ...l, unitPrice: priceOf(l.stockItemId, cur) || (wasAuto ? "" : l.unitPrice) };
    }));
    setCurrency(cur);
  };

  const totals = lines.map((l) => (l.stockItemId ? (Number(l.quantity) || 0) * (safeMoney(l.unitPrice) ?? 0) : 0));
  const grandTotal = totals.reduce((a, b) => a + b, 0);
  const payload = JSON.stringify(lines.filter((l) => l.stockItemId).map((l) => ({ stockItemId: l.stockItemId, quantity: Number(l.quantity), unitPrice: l.unitPrice })));

  return (
    <ActionForm action={action} submitLabel={isEdit ? "Satışı güncelle" : "Satışı kaydet"}>
      <input type="hidden" name="lines" value={payload} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-2">
          <label className={labelCls}>Müşteri / cari <span className="text-[#E4171E]">*</span></label>
          <select name="customerId" required defaultValue={initial.customerId ?? ""} className={inputCls}>
            <option value="">Cari seçin</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Satış tarihi</label>
          <input type="date" name="date" required defaultValue={initial.date} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Para birimi</label>
          <select name="currency" value={currency} onChange={(e) => changeCurrency(e.target.value)} className={inputCls}>
            {currencies.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="lg:col-span-2">
          <label className={labelCls}>Araç plakası <span className="text-gray-600">(isteğe bağlı)</span></label>
          <input name="plate" defaultValue={initial.plate} className={inputCls} placeholder="Örn. AB 123" />
        </div>
        <div className="lg:col-span-2">
          <label className={labelCls}>Notlar</label>
          <input name="notes" defaultValue={initial.notes} className={inputCls} placeholder="İsteğe bağlı" />
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-white font-semibold text-sm">Satış kalemleri</div>
        <div className="hidden md:grid grid-cols-[1fr_90px_90px_130px_130px_36px] gap-3 text-xs text-gray-500 uppercase tracking-wide">
          <span>Ürün</span><span>Stokta</span><span>Adet</span><span>Birim fiyat</span><span className="text-right">Satır toplamı</span><span />
        </div>
        {lines.map((l, idx) => {
          const item = items.find((i) => i.id === l.stockItemId);
          const available = item ? item.quantity + (reserved.get(item.id) ?? 0) : null;
          const short = available !== null && (Number(l.quantity) || 0) > available;
          return (
            <div key={l.key} className="grid grid-cols-1 md:grid-cols-[1fr_90px_90px_130px_130px_36px] gap-3 items-center border-b border-[#2a2a2a] md:border-0 pb-3 md:pb-0">
              <ItemPicker
                items={items} value={l.stockItemId}
                excludeIds={lines.filter((x) => x.key !== l.key && x.stockItemId).map((x) => x.stockItemId!)}
                onChange={(id) => update(l.key, { stockItemId: id, unitPrice: priceOf(id, currency) || l.unitPrice })}
              />
              <div className={`text-sm ${short ? "text-red-400 font-semibold" : "text-gray-400"}`}>{available ?? "—"}</div>
              <input type="number" min={1} step={1} value={l.quantity} onChange={(e) => update(l.key, { quantity: e.target.value })}
                className={`${inputCls} ${short ? "!border-red-500" : ""}`} />
              <div className="relative">
                <input inputMode="decimal" value={l.unitPrice} onChange={(e) => update(l.key, { unitPrice: e.target.value })}
                  className={`${inputCls} pr-11`} placeholder="Fiyat" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">{currency}</span>
              </div>
              <div className="text-sm text-white text-right font-semibold">{formatMoney(totals[idx])}</div>
              <button type="button" onClick={() => setLines((ls) => (ls.length > 1 ? ls.filter((x) => x.key !== l.key) : ls))}
                className="p-2 text-gray-500 hover:text-red-400 rounded-lg" aria-label="Satırı sil">
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button type="button" className={btnSmall}
            onClick={() => setLines((ls) => [...ls, { key: Math.max(0, ...ls.map((x) => x.key)) + 1, stockItemId: null, quantity: "1", unitPrice: "" }])}>
            <Plus className="w-3.5 h-3.5" /> Ürün satırı ekle
          </button>
          <div className="text-right">
            <div className="text-xs text-gray-500">Genel toplam</div>
            <div className="text-2xl font-black text-white">{formatMoney(grandTotal, currency)}</div>
          </div>
        </div>
      </div>

      {isEdit ? (
        paid > 0 && <p className="text-sm text-gray-400">Bu satışa daha önce {formatMoney(paid, currency)} tahsilat bağlanmış. Yeni toplam bu tutarın altına inemez.</p>
      ) : (
        <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl p-4">
          <div className="text-white font-semibold text-sm mb-1">Satışla birlikte ödeme alındı mı?</div>
          <p className="text-gray-500 text-xs mb-3">Girerseniz aynı para biriminde tahsilat makbuzu oluşur ve satışa bağlanır.</p>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
            <div>
              <label className={labelCls}>Alınan tutar</label>
              <input name="firstPayment" inputMode="decimal" value={firstPayment} onChange={(e) => setFirstPayment(e.target.value)} className={inputCls} placeholder="0,00" />
            </div>
            <div>
              <label className={labelCls}>Ödeme yöntemi</label>
              <select name="method" className={inputCls}>{methods.map((m) => <option key={m}>{m}</option>)}</select>
            </div>
            <button type="button" className={`${btnSmall} h-[42px]`} onClick={() => setFirstPayment(centsToInput(grandTotal))}>Tamamı ödendi</button>
          </div>
        </div>
      )}
    </ActionForm>
  );
}
