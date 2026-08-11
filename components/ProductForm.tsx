"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, Star, Loader2, Camera, CheckCircle } from "lucide-react";

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
    categoryId?: number;
    subcategory?: string | null;
    featured?: boolean;
    sortOrder?: number;
  };
}

export default function ProductForm({ categories, initial }: ProductFormProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const isEdit = !!initial?.id;

  const [form, setForm] = useState({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    price: initial?.price?.toString() ?? "",
    categoryId: initial?.categoryId?.toString() ?? categories[0]?.id?.toString() ?? "",
    subcategory: initial?.subcategory ?? "",
    featured: initial?.featured ?? false,
    sortOrder: initial?.sortOrder?.toString() ?? "0",
    image: initial?.image ?? "",
  });

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);

  function set(field: string, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Copy file reference before resetting input (required for Android Chrome)
    const fileCopy = new File([file], file.name, { type: file.type || "image/jpeg" });
    e.target.value = "";
    if (fileCopy.size === 0) { setError("Görsel okunamadı, tekrar deneyin"); return; }
    setUploading(true);
    setError("");
    const fd = new FormData();
    fd.append("file", fileCopy);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (data.url) {
      set("image", data.url);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } else {
      setError(data.error ?? "Görsel yüklenemedi");
    }
    setUploading(false);
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
      image: form.image || null,
      categoryId: parseInt(form.categoryId),
      subcategory: form.subcategory || null,
      featured: form.featured,
      sortOrder: parseInt(form.sortOrder) || 0,
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
        <label className="block text-sm text-gray-400 mb-2">Ürün Görseli</label>

        {/* Preview */}
        <div className="w-full aspect-video bg-[#111111] border-2 border-dashed border-[#3a3a3a] rounded-xl overflow-hidden relative mb-3">
          {uploading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-8 h-8 text-[#E4171E] animate-spin" />
              <span className="text-gray-500 text-xs">Yükleniyor...</span>
            </div>
          ) : form.image ? (
            <>
              {/* Plain img — Next.js Image not used here to avoid fill/optimization issues */}
              <img
                src={form.image}
                alt="Ürün görseli"
                className="w-full h-full object-contain p-4"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  setError("Görsel gösterilemiyor: " + form.image);
                }}
              />
              <button
                type="button"
                onClick={() => { set("image", ""); setUploadSuccess(false); }}
                className="absolute top-2 right-2 bg-black/60 hover:bg-red-600 text-white rounded-full p-1.5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              {uploadSuccess && (
                <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-green-900/80 text-green-300 text-xs px-2.5 py-1 rounded-full">
                  <CheckCircle className="w-3.5 h-3.5" /> Yüklendi
                </div>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-600">
              <Upload className="w-8 h-8" />
              <span className="text-xs">Görsel seç veya kamerayla çek</span>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center justify-center gap-2 bg-[#1a1a1a] border border-[#3a3a3a] hover:border-[#E4171E]/50 text-gray-300 text-sm px-4 py-3 rounded-xl transition-colors"
          >
            <Upload className="w-4 h-4" />
            Galeriden Seç
          </button>
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            className="flex items-center justify-center gap-2 bg-[#1a1a1a] border border-[#3a3a3a] hover:border-[#E4171E]/50 text-gray-300 text-sm px-4 py-3 rounded-xl transition-colors"
          >
            <Camera className="w-4 h-4" />
            Kamera ile Çek
          </button>
        </div>
        <p className="text-gray-600 text-xs mt-2">JPG, PNG, WEBP veya HEIC. Maks. 5MB.</p>

        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        {/* capture="environment" opens rear camera directly on mobile */}
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

        {/* Subcategory */}
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Alt Kategori</label>
          <input
            type="text"
            value={form.subcategory}
            onChange={(e) => set("subcategory", e.target.value)}
            placeholder="Örn: Multimedya, Tweeter, Subwoofer..."
            className="w-full bg-[#0d0d0d] border border-[#3a3a3a] focus:border-[#E4171E] text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm outline-none transition-colors"
          />
        </div>

        {/* Sort order */}
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Sıralama</label>
          <input
            type="number"
            min="0"
            value={form.sortOrder}
            onChange={(e) => set("sortOrder", e.target.value)}
            className="w-full bg-[#0d0d0d] border border-[#3a3a3a] focus:border-[#E4171E] text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm outline-none transition-colors"
          />
          <p className="text-gray-600 text-xs mt-1">Küçük sayı önce görünür</p>
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
