"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AddUserForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSuccess("");
    setLoading(true);

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Bir hata oluştu");
    } else {
      setSuccess("Kullanıcı başarıyla eklendi.");
      setForm({ name: "", email: "", password: "" });
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-red-950/50 border border-red-900/50 text-red-400 text-sm px-4 py-3 rounded-xl">{error}</div>}
      {success && <div className="bg-green-950/50 border border-green-900/50 text-green-400 text-sm px-4 py-3 rounded-xl">{success}</div>}

      <div>
        <label className="block text-sm text-gray-400 mb-1.5">Ad Soyad</label>
        <input type="text" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ali Yılmaz"
          className="w-full bg-[#0d0d0d] border border-[#3a3a3a] focus:border-[#E4171E] text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm outline-none transition-colors" />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1.5">Email <span className="text-[#E4171E]">*</span></label>
        <input type="email" required value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} placeholder="ali@dselectronics.com"
          className="w-full bg-[#0d0d0d] border border-[#3a3a3a] focus:border-[#E4171E] text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm outline-none transition-colors" />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1.5">Şifre <span className="text-[#E4171E]">*</span></label>
        <input type="password" required minLength={8} value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Minimum 8 karakter"
          className="w-full bg-[#0d0d0d] border border-[#3a3a3a] focus:border-[#E4171E] text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm outline-none transition-colors" />
      </div>
      <button type="submit" disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-[#E4171E] hover:bg-[#B5121A] disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors text-sm">
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {loading ? "Ekleniyor..." : "Kullanıcı Ekle"}
      </button>
    </form>
  );
}
