"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";

export default function AddCategoryForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError("");

    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), description: description.trim() || null }),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error ?? "Bir hata oluştu");
    } else {
      setName("");
      setDescription("");
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-950/50 border border-red-900/50 text-red-400 text-sm px-4 py-3 rounded-xl">{error}</div>
      )}

      <div>
        <label className="block text-sm text-gray-400 mb-1.5">
          Kategori Adı <span className="text-[#E4171E]">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Örn: Oto Teyp"
          className="w-full bg-[#0d0d0d] border border-[#3a3a3a] focus:border-[#E4171E] text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm outline-none transition-colors"
        />
        <p className="text-gray-600 text-xs mt-1">URL'de kullanılacak slug otomatik oluşturulur</p>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1.5">Açıklama <span className="text-gray-600">(opsiyonel)</span></label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Kısa bir açıklama..."
          className="w-full bg-[#0d0d0d] border border-[#3a3a3a] focus:border-[#E4171E] text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm outline-none transition-colors"
        />
      </div>

      <button
        type="submit"
        disabled={saving || !name.trim()}
        className="flex items-center gap-2 bg-[#E4171E] hover:bg-[#B5121A] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        {saving ? "Ekleniyor..." : "Kategori Ekle"}
      </button>
    </form>
  );
}
