"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";

interface Props {
  id: number;
  name: string;
  productCount: number;
}

export default function DeleteCategoryButton({ id, name, productCount }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (productCount > 0) {
      alert(`"${name}" kategorisinde ${productCount} ürün var. Önce ürünleri silin veya başka kategoriye taşıyın.`);
      return;
    }
    if (!confirm(`"${name}" kategorisini silmek istediğinize emin misiniz?`)) return;

    setLoading(true);
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    setLoading(false);

    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json();
      alert(data.error ?? "Silinemedi");
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading || productCount > 0}
      title={productCount > 0 ? `${productCount} ürün var, silinemez` : "Sil"}
      className="p-2 text-gray-600 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded-lg"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
    </button>
  );
}
