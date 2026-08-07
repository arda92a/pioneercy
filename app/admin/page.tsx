import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Package, Plus, TrendingUp, Tag } from "lucide-react";

export default async function AdminDashboard() {
  const [productCount, categoryStats, recentProducts] = await Promise.all([
    prisma.product.count(),
    prisma.category.findMany({ include: { _count: { select: { products: true } } } }),
    prisma.product.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { category: true },
    }),
  ]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Hoş geldiniz, D.S. Electronics Yönetim Paneli</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-gray-500 text-sm">Toplam Ürün</div>
            <Package className="w-5 h-5 text-[#E4171E]" />
          </div>
          <div className="text-3xl font-black text-white">{productCount}</div>
        </div>
        {categoryStats.map((cat) => (
          <div key={cat.id} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-gray-500 text-xs truncate pr-2">{cat.name}</div>
              <Tag className="w-4 h-4 text-[#E4171E] shrink-0" />
            </div>
            <div className="text-3xl font-black text-white">{cat._count.products}</div>
            <div className="text-gray-600 text-xs mt-1">ürün</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Link href="/admin/urunler/yeni" className="flex items-center gap-4 bg-[#E4171E]/10 border border-[#E4171E]/30 hover:border-[#E4171E] rounded-xl p-5 transition-colors group">
          <div className="w-10 h-10 bg-[#E4171E] rounded-xl flex items-center justify-center">
            <Plus className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-white font-semibold group-hover:text-[#E4171E] transition-colors">Yeni Ürün Ekle</div>
            <div className="text-gray-500 text-xs">Kataloga yeni ürün ekleyin</div>
          </div>
        </Link>
        <Link href="/admin/urunler" className="flex items-center gap-4 bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#E4171E]/50 rounded-xl p-5 transition-colors group">
          <div className="w-10 h-10 bg-[#2a2a2a] rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          <div>
            <div className="text-white font-semibold">Ürünleri Yönet</div>
            <div className="text-gray-500 text-xs">Fiyat ve bilgi güncelle</div>
          </div>
        </Link>
      </div>

      {/* Recent products */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl">
        <div className="flex items-center justify-between p-5 border-b border-[#2a2a2a]">
          <h2 className="text-white font-semibold text-sm">Son Eklenen Ürünler</h2>
          <Link href="/admin/urunler" className="text-[#E4171E] text-xs hover:text-[#B5121A] transition-colors">Tümünü Gör</Link>
        </div>
        <div className="divide-y divide-[#2a2a2a]">
          {recentProducts.length === 0 ? (
            <div className="p-8 text-center text-gray-600 text-sm">Henüz ürün eklenmemiş.</div>
          ) : (
            recentProducts.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <div className="text-white text-sm font-medium">{p.name}</div>
                  <div className="text-gray-500 text-xs">{p.category.name}</div>
                </div>
                <Link href={`/admin/urunler/${p.id}`} className="text-xs text-[#E4171E] hover:text-[#B5121A] transition-colors">
                  Düzenle
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
