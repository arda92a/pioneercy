"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Check, X, Loader2, Image as ImageIcon } from "lucide-react";

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  _count: { products: number };
}

export default function CategoryList({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editImage, setEditImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [error, setError] = useState("");

  function startEdit(cat: Category) {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditDesc(cat.description ?? "");
    setEditImage(cat.image ?? null);
    setError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setError("");
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setError("");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);
    if (data.url) setEditImage(data.url);
    else setError(data.error ?? "Görsel yüklenemedi");
  }

  async function saveEdit(id: number) {
    if (!editName.trim()) return;
    setSaving(true);
    setError("");
    const res = await fetch(`/api/categories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim(), description: editDesc.trim() || null, image: editImage }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Kaydedilemedi");
    } else {
      setEditingId(null);
      router.refresh();
    }
  }


  async function handleDelete(cat: Category) {
    if (cat._count.products > 0) {
      alert(`"${cat.name}" kategorisinde ${cat._count.products} ürün var. Önce ürünleri silin veya başka kategoriye taşıyın.`);
      return;
    }
    if (!confirm(`"${cat.name}" kategorisini silmek istediğinize emin misiniz?`)) return;
    setDeleting(cat.id);
    const res = await fetch(`/api/categories/${cat.id}`, { method: "DELETE" });
    setDeleting(null);
    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json();
      alert(data.error ?? "Silinemedi");
    }
  }

  if (categories.length === 0) {
    return <div className="px-5 py-8 text-center text-gray-600 text-sm">Henüz kategori yok</div>;
  }

  return (
    <div className="divide-y divide-[#1f1f1f]">
      {error && (
        <div className="px-5 py-3 bg-red-950/50 border-b border-red-900/50 text-red-400 text-xs">{error}</div>
      )}
      {categories.map((cat) => (
        <div key={cat.id} className="px-5 py-4">
          {editingId === cat.id ? (
            /* Inline edit form */
            <div className="space-y-2">
              <input
                autoFocus
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") saveEdit(cat.id); if (e.key === "Escape") cancelEdit(); }}
                className="w-full bg-[#0d0d0d] border border-[#E4171E]/60 text-white rounded-lg px-3 py-2 text-sm outline-none"
              />
              <input
                type="text"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") saveEdit(cat.id); if (e.key === "Escape") cancelEdit(); }}
                placeholder="Açıklama (opsiyonel)"
                className="w-full bg-[#0d0d0d] border border-[#3a3a3a] text-white placeholder-gray-600 rounded-lg px-3 py-2 text-sm outline-none"
              />
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 shrink-0 bg-[#0d0d0d] border border-[#3a3a3a] rounded-lg overflow-hidden flex items-center justify-center">
                  {editImage ? (
                    <img src={editImage} alt="Kapak görseli" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-5 h-5 text-gray-700" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-1.5 bg-[#1a1a1a] border border-[#3a3a3a] hover:border-[#E4171E]/50 disabled:opacity-50 text-gray-400 text-xs px-3 py-2 rounded-lg transition-colors"
                >
                  {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
                  {uploading ? "Yükleniyor..." : "Ana Sayfa Görseli Seç"}
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => saveEdit(cat.id)}
                  disabled={saving || !editName.trim()}
                  className="flex items-center gap-1.5 bg-[#E4171E] hover:bg-[#B5121A] disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Kaydet
                </button>
                <button
                  onClick={cancelEdit}
                  className="flex items-center gap-1.5 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-gray-400 text-xs px-3 py-1.5 rounded-lg transition-colors"
                >
                  <X className="w-3.5 h-3.5" /> İptal
                </button>
              </div>
            </div>
          ) : (
            /* Display row */
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 shrink-0 bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg overflow-hidden flex items-center justify-center">
                  {cat.image ? (
                    <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-4 h-4 text-gray-700" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-white text-sm font-medium">{cat.name}</div>
                  <div className="text-gray-600 text-xs mt-0.5 truncate">
                    /{cat.slug} · {cat._count.products} ürün
                    {cat.description && <span className="ml-2 text-gray-700">— {cat.description}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => startEdit(cat)}
                  className="p-2 text-gray-500 hover:text-white hover:bg-[#2a2a2a] rounded-lg transition-colors"
                  title="Düzenle"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(cat)}
                  disabled={deleting === cat.id || cat._count.products > 0}
                  title={cat._count.products > 0 ? `${cat._count.products} ürün var, silinemez` : "Sil"}
                  className="p-2 text-gray-600 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded-lg"
                >
                  {deleting === cat.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
