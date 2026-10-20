"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { inputCls } from "@/components/stok/ui";

export type PickerItem = {
  id: number;
  code: string;
  brand: string;
  model: string;
  name: string;
  quantity: number;
  prices: Record<string, number | null>;
};

export const itemLabel = (i: PickerItem) => `${i.brand} ${i.model}`.trim() + ` · ${i.name}`;

/** Kod, marka, model veya ürün adıyla aranabilen ürün seçici. */
export default function ItemPicker({
  items, value, onChange, excludeIds = [],
}: {
  items: PickerItem[];
  value: number | null;
  onChange: (id: number | null) => void;
  excludeIds?: number[];
}) {
  const selected = items.find((i) => i.id === value) ?? null;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  const matches = useMemo(() => {
    const words = query.toLocaleLowerCase("tr").split(/\s+/).filter(Boolean);
    return items
      .filter((i) => !excludeIds.includes(i.id) || i.id === value)
      .filter((i) => {
        const hay = `${i.code} ${i.brand} ${i.model} ${i.name}`.toLocaleLowerCase("tr");
        return words.every((w) => hay.includes(w));
      })
      .slice(0, 60);
  }, [items, query, excludeIds, value]);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  function pick(item: PickerItem) {
    onChange(item.id);
    setOpen(false);
    setQuery("");
  }

  return (
    <div ref={boxRef} className="relative min-w-[240px]">
      <div className="relative">
        <input
          className={`${inputCls} pr-8`}
          value={open ? query : selected ? `${selected.code} — ${itemLabel(selected)}` : ""}
          placeholder="Ürün ara (kod, marka, model)…"
          onFocus={() => { setOpen(true); setActive(0); }}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); setActive(0); }}
          onKeyDown={(e) => {
            if (!open) return;
            if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, matches.length - 1)); }
            if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
            if (e.key === "Enter") { e.preventDefault(); if (matches[active]) pick(matches[active]); }
            if (e.key === "Escape") setOpen(false);
          }}
        />
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
      </div>
      {open && (
        <div className="absolute z-30 mt-1 w-full max-h-72 overflow-y-auto bg-[#1a1a1a] border border-[#3a3a3a] rounded-xl shadow-2xl">
          {matches.length === 0 ? (
            <div className="px-3 py-3 text-sm text-gray-500">Eşleşen ürün yok.</div>
          ) : matches.map((i, idx) => (
            <button
              type="button" key={i.id}
              onMouseDown={(e) => { e.preventDefault(); pick(i); }}
              onMouseEnter={() => setActive(idx)}
              className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-3 ${idx === active ? "bg-[#2a2a2a]" : ""}`}
            >
              <span className="min-w-0">
                <span className="text-white">{itemLabel(i)}</span>
                <span className="block text-xs text-gray-500">{i.code}</span>
              </span>
              <span className={`text-xs shrink-0 ${i.quantity > 0 ? "text-emerald-400" : "text-red-400"}`}>{i.quantity} adet</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
