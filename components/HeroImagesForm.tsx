"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Loader2, ImageOff, Trash2 } from "lucide-react";

interface Category {
  id: number;
  name: string;
  slug: string;
  image: string | null;
}

export default function HeroImagesForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const fileRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function handleUpload(cat: Category, file: File) {
    if (!file.type.startsWith("image/")) { setError("Sadece görsel dosyaları yüklenebilir"); return; }
    setBusyId(cat.id);
    setError("");

    const fd = new FormData();
    fd.append("file", file);
    const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
    const uploadData = await uploadRes.json();
    if (!uploadData.url) {
      setBusyId(null);
      setError(uploadData.error ?? "Görsel yüklenemedi");
      return;
    }

    const res = await fetch(`/api/categories/${cat.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: cat.name, image: uploadData.url }),
    });
    setBusyId(null);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Kaydedilemedi");
    } else {
      router.refresh();
    }
  }

  async function handleRemove(cat: Category) {
    if (!confirm(`"${cat.name}" için ana sayfa görselini kaldırmak istediğinize emin misiniz?`)) return;
    setBusyId(cat.id);
    setError("");
    const res = await fetch(`/api/categories/${cat.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: cat.name, image: null }),
    });
    setBusyId(null);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Kaldırılamadı");
    } else {
      router.refresh();
    }
  }

  if (categories.length === 0) {
    return <div className="px-5 py-8 text-center text-gray-600 text-sm">Henüz kategori yok</div>;
  }

  return (
    <div>
      {error && (
        <div className="bg-red-950/50 border border-red-900/50 text-red-400 text-sm px-4 py-3 rounded-xl mb-5">{error}</div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories.map((cat) => {
          const busy = busyId === cat.id;
          return (
            <div key={cat.id} className="bg-[#111111] border border-[#2a2a2a] rounded-2xl overflow-hidden">
              <div className="relative aspect-[16/10] bg-[#0d0d0d]">
                {cat.image ? (
                  <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-700">
                    <ImageOff className="w-6 h-6" />
                    <span className="text-xs">Görsel yok</span>
                  </div>
                )}
                {busy && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="text-white text-sm font-semibold mb-3">{cat.name}</div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileRefs.current[cat.id]?.click()}
                    disabled={busy}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-[#1a1a1a] border border-[#3a3a3a] hover:border-[#E4171E]/50 disabled:opacity-50 text-gray-300 text-xs font-medium px-3 py-2 rounded-lg transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {cat.image ? "Görseli Değiştir" : "Görsel Yükle"}
                  </button>
                  {cat.image && (
                    <button
                      type="button"
                      onClick={() => handleRemove(cat)}
                      disabled={busy}
                      title="Görseli kaldır"
                      className="p-2 text-gray-600 hover:text-red-400 disabled:opacity-30 transition-colors rounded-lg border border-transparent hover:border-red-900/40"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <input
                  ref={(el) => { fileRefs.current[cat.id] = el; }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (file) handleUpload(cat, file);
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
