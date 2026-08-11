"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, Star, Loader2, Camera, Plus } from "lucide-react";

interface Category {
  id: number;
  name: string;
}

interface ProductFormProps {
  categories: Category[];
  initial?: {
    id?: number;
    name?: string;
    description?: string;
    price?: number | null;
    image?: string | null;
    images?: string | null;
    categoryId?: number;
    featured?: boolean;
    stock?: number;
  };
}

export default function ProductForm({ categories, initial }: ProductFormProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const isEdit = !!initial?.id;

  // Parse initial images from JSON or fallback to single image
  const initImages: string[] = (() => {
    try { const arr = JSON.parse(initial?.images ?? "[]"); return Array.isArray(arr) ? arr : []; }
    catch { return initial?.image ? [initial.image] : []; }
  })();

  const [images, setImages] = useState<string[]>(initImages);
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    price: initial?.price?.toString() ?? "",
    categoryId: initial?.categoryId?.toString() ?? categories[0]?.id?.toString() ?? "",
    featured: initial?.featured ?? false,
    stock: initial?.stock?.toString() ?? "0",
  });

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  function set(field: string, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function uploadFile(file: File) {
    if (!file.type.startsWith("image/")) { setError("Sadece görsel dosyaları yüklenebilir"); return; }
    if (file.size === 0) { setError("Görsel okunamadı, tekrar deneyin"); return; }
    setUploading(true);
    setError("");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (data.url) {
      setImages((prev) => [...prev, data.url]);
    } else {
      setError(data.error ?? "Görsel yüklenemedi");
    }
    setUploading(false);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    for (const file of files) {
      const copy = new File([file], file.name, { type: file.type || "image/jpeg" });
      await uploadFile(copy);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    files.forEach((f) => uploadFile(f));
  }

  function removeImage(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.categoryId) { setError("İsim ve kategori zorunludur"); return; }
    setSaving(true);
    setError("");

    const body = {
      name: form.name,
      description: form.description || null,
      price: form.price !== "" ? parseFloat(form.price) : null,
      image: images[0] || null,
      images: JSON.stringify(images),
      categoryId: parseInt(form.categoryId),
      featured: form.featured,
      stock: parseInt(form.stock) || 0,
    };

    const url = isEdit ? `/api/products/${initial!.id}` : "/api/products";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();

    setSaving(false);

    if (!res.ok) {
      setError(data.error ?? "Bir hata oluştu");
    } else {
      router.push("/admin/urunler");
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="bg-red-950/50 border border-red-900/50 text-red-400 text-sm px-4 py-3 rounded-xl">{error}</div>
      )}

      {/* Image upload */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">
          Ürün Görselleri
          <span className="text-gray-600 text-xs font-normal ml-2">({images.length} görsel — ilk görsel ana görsel olur)</span>
        </label>

        {/* Thumbnail grid */}
        {images.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {images.map((url, idx) => (
              <div key={idx} className="relative w-20 h-20 bg-[#111111] border-2 border-[#3a3a3a] rounded-xl overflow-hidden group">
                {idx === 0 && (
                  <span className="absolute top-0.5 left-0.5 z-10 bg-[#E4171E] text-white text-[9px] font-bold px-1 rounded">ANA</span>
                )}
                <img src={url} alt={`Görsel ${idx + 1}`} className="w-full h-full object-contain p-1.5" />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Drop zone */}
        <div
          className={`w-full border-2 border-dashed rounded-xl transition-colors cursor-pointer
            ${dragOver ? "border-[#E4171E] bg-[#E4171E]/5" : "border-[#3a3a3a] hover:border-[#5a5a5a]"}
            ${uploading ? "pointer-events-none" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && fileRef.current?.click()}
        >
          <div className="flex flex-col items-center justify-center gap-2 text-gray-500 py-6">
            {uploading ? (
              <><Loader2 className="w-7 h-7 text-[#E4171E] animate-spin" /><span className="text-xs">Yükleniyor...</span></>
            ) : (
              <><Plus className="w-7 h-7" /><span className="text-xs">{dragOver ? "Bırak!" : "Görsel ekle — sürükle veya tıkla"}</span></>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 bg-[#1a1a1a] border border-[#3a3a3a] hover:border-[#E4171E]/50 text-gray-400 text-xs px-3 py-2 rounded-lg transition-colors"
          >
            <Upload className="w-3.5 h-3.5" /> Galeriden Seç
          </button>
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            className="flex items-center gap-1.5 bg-[#1a1a1a] border border-[#3a3a3a] hover:border-[#E4171E]/50 text-gray-400 text-xs px-3 py-2 rounded-lg transition-colors"
          >
            <Camera className="w-3.5 h-3.5" /> Kamera
          </button>
        </div>
        <p className="text-gray-600 text-xs mt-1.5">JPG, PNG, WEBP veya HEIC. Birden fazla seçilebilir.</p>

        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm text-gray-400 mb-1.5">Ürün Adı <span className="text-[#E4171E]">*</span></label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          required
          placeholder="Örn: Pioneer MVH-S325BT"
          className="w-full bg-[#0d0d0d] border border-[#3a3a3a] focus:border-[#E4171E] text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm outline-none transition-colors"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm text-gray-400 mb-1.5">Açıklama</label>
        <textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={3}
          placeholder="Ürün hakkında kısa bir açıklama..."
          className="w-full bg-[#0d0d0d] border border-[#3a3a3a] focus:border-[#E4171E] text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm outline-none transition-colors resize-none"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Price */}
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Fiyat (EUR)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={(e) => set("price", e.target.value)}
            placeholder="0.00"
            className="w-full bg-[#0d0d0d] border border-[#3a3a3a] focus:border-[#E4171E] text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm outline-none transition-colors"
          />
          <p className="text-gray-600 text-xs mt-1">Boş bırakılırsa &quot;Fiyat sorunuz&quot; görünür</p>
        </div>

        {/* Stock */}
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Stok Adedi</label>
          <input
            type="number"
            min="0"
            value={form.stock}
            onChange={(e) => set("stock", e.target.value)}
            className="w-full bg-[#0d0d0d] border border-[#3a3a3a] focus:border-[#E4171E] text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm outline-none transition-colors"
          />
          <p className="text-gray-600 text-xs mt-1">0 girilirse katalogda &quot;Stok Yok&quot; yazılır</p>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Kategori <span className="text-[#E4171E]">*</span></label>
          <select
            value={form.categoryId}
            onChange={(e) => set("categoryId", e.target.value)}
            required
            className="w-full bg-[#0d0d0d] border border-[#3a3a3a] focus:border-[#E4171E] text-white rounded-xl px-4 py-3 text-sm outline-none transition-colors"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Featured */}
      <label className="flex items-center gap-3 cursor-pointer group">
        <div
          className={`w-10 h-6 rounded-full transition-colors ${form.featured ? "bg-[#E4171E]" : "bg-[#3a3a3a]"}`}
          onClick={() => set("featured", !form.featured)}
        >
          <div className={`w-4 h-4 bg-white rounded-full mt-1 transition-transform ${form.featured ? "translate-x-5" : "translate-x-1"}`} />
        </div>
        <div className="flex items-center gap-1.5">
          <Star className={`w-4 h-4 ${form.featured ? "text-yellow-400 fill-current" : "text-gray-500"}`} />
          <span className="text-sm text-gray-300">Ana sayfada öne çıkar</span>
        </div>
      </label>

      {/* Submit */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-[#E4171E] hover:bg-[#B5121A] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 rounded-xl transition-colors text-sm"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? "Kaydediliyor..." : isEdit ? "Güncelle" : "Ürün Ekle"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 bg-[#1a1a1a] border border-[#3a3a3a] text-gray-400 hover:text-white rounded-xl transition-colors text-sm"
        >
          İptal
        </button>
      </div>
    </form>
  );
}

