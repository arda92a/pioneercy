"use client";
import { Printer } from "lucide-react";
import { btnPrimary } from "@/components/stok/ui";

export default function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className={btnPrimary}>
      <Printer className="w-4 h-4" /> Yazdır / PDF olarak kaydet
    </button>
  );
}
