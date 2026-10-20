"use client";
import { useMemo, useState } from "react";
import ActionForm from "@/components/stok/ActionForm";
import { btnSmall, inputCls, labelCls } from "@/components/stok/ui";
import { centsToInput, formatDay, formatMoney, parseMoney } from "@/lib/stok/format";
import type { ActionState } from "@/lib/stok/server";

type OpenSale = { id: number; code: string; date: string; customerId: number; currency: string; total: number; remaining: number };

function safeMoney(text: string) {
  try { return parseMoney(text) ?? 0; } catch { return 0; }
}

export default function PaymentForm({
  action, customers, currencies, methods, openSales, initial,
}: {
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
  customers: { id: number; code: string; name: string }[];
  currencies: string[];
  methods: string[];
  openSales: OpenSale[];
  initial: { customerId: number | null; currency: string; date: string; saleId: number | null };
}) {
  const preSale = openSales.find((s) => s.id === initial.saleId);
  const [customerId, setCustomerId] = useState<number | null>(preSale?.customerId ?? initial.customerId);
  const [currency, setCurrency] = useState(preSale?.currency ?? initial.currency);
  const [amount, setAmount] = useState(preSale ? centsToInput(preSale.remaining) : "");
  const [alloc, setAlloc] = useState<Record<number, string>>(preSale ? { [preSale.id]: centsToInput(preSale.remaining) } : {});

  const sales = useMemo(
    () => openSales.filter((s) => s.customerId === customerId && s.currency === currency).sort((a, b) => a.date.localeCompare(b.date)),
    [openSales, customerId, currency],
  );
  const otherCurrencies = [...new Set(openSales.filter((s) => s.customerId === customerId && s.currency !== currency).map((s) => s.currency))];
  const allocated = sales.reduce((s, sale) => s + safeMoney(alloc[sale.id] ?? ""), 0);
  const amountCents = safeMoney(amount);
  const unallocated = amountCents - allocated;

  function autoDistribute() {
    let left = amountCents;
    const next: Record<number, string> = {};
    for (const s of sales) {
      const take = Math.min(left, s.remaining);
      if (take > 0) next[s.id] = centsToInput(take);
      left -= take;
    }
    setAlloc(next);
  }

  const payload = JSON.stringify(sales.filter((s) => alloc[s.id]).map((s) => ({ saleId: s.id, amount: alloc[s.id] })));

  return (
    <ActionForm action={action} submitLabel="Tahsilatı kaydet">
      <input type="hidden" name="lines" value={payload} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-2">
          <label className={labelCls}>Cari <span className="text-[#E4171E]">*</span></label>
          <select name="customerId" required value={customerId ?? ""} onChange={(e) => { setCustomerId(Number(e.target.value) || null); setAlloc({}); }} className={inputCls}>
            <option value="">Cari seçin</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Tarih</label>
          <input type="date" name="date" required defaultValue={initial.date} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Para birimi</label>
          <select name="currency" value={currency} onChange={(e) => { setCurrency(e.target.value); setAlloc({}); }} className={inputCls}>
            {currencies.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Tutar <span className="text-[#E4171E]">*</span></label>
          <div className="relative">
            <input name="amount" required inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className={`${inputCls} pr-11`} placeholder="0,00" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">{currency}</span>
          </div>
        </div>
        <div>
          <label className={labelCls}>Ödeme yöntemi</label>
          <select name="method" className={inputCls}>{methods.map((m) => <option key={m}>{m}</option>)}</select>
        </div>
        <div className="lg:col-span-2">
          <label className={labelCls}>Açıklama</label>
          <input name="note" className={inputCls} placeholder="İsteğe bağlı" />
        </div>
      </div>

      <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <div className="text-white font-semibold text-sm">Satışlara dağıt <span className="text-gray-600 font-normal">(isteğe bağlı)</span></div>
            <p className="text-gray-500 text-xs">Dağıtılmayan tutar cari hesaba genel tahsilat olarak düşer.</p>
          </div>
          {sales.length > 0 && <button type="button" onClick={autoDistribute} className={btnSmall}>Eskiden yeniye otomatik dağıt</button>}
        </div>
        {!customerId ? <p className="text-sm text-gray-600">Önce cari seçin.</p> : sales.length === 0 ? (
          <p className="text-sm text-gray-600">
            Bu carinin {currency} cinsinden ödenmemiş satışı yok.
            {otherCurrencies.length > 0 && ` (${otherCurrencies.join(", ")} cinsinden açık satışı var.)`}
          </p>
        ) : (
          <div className="space-y-2">
            {sales.map((s) => (
              <div key={s.id} className="grid grid-cols-[1fr_140px] gap-3 items-center">
                <div className="text-sm">
                  <span className="text-white font-medium">{s.code}</span> <span className="text-gray-500">· {formatDay(s.date)}</span>
                  <div className="text-xs text-gray-500">Kalan: {formatMoney(s.remaining, currency)} / {formatMoney(s.total, currency)}</div>
                </div>
                <input inputMode="decimal" value={alloc[s.id] ?? ""} onChange={(e) => setAlloc((a) => ({ ...a, [s.id]: e.target.value }))}
                  className={inputCls} placeholder="0,00" />
              </div>
            ))}
            <div className={`text-sm text-right pt-2 ${unallocated < 0 ? "text-red-400" : "text-gray-400"}`}>
              Dağıtılan: {formatMoney(allocated, currency)} · Dağıtılmayan: {formatMoney(unallocated, currency)}
            </div>
          </div>
        )}
      </div>
    </ActionForm>
  );
}
