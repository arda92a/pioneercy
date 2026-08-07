"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export default function DeleteProductButton({ id }: { id: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Bu ürünü silmek istediğinize emin misiniz?")) return;
    setLoading(true);
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors disabled:opacity-50"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
