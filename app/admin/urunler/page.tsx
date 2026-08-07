import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { Plus, Pencil, Star } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import DeleteProductButton from "@/components/DeleteProductButton";

export const revalidate = 0;

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }],
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white">Ürünler</h1>
          <p className="text-gray-500 text-sm mt-1">{products.length} ürün</p>
        </div>
        <Link
          href="/admin/urunler/yeni"
          className="flex items-center gap-2 bg-[#E4171E] hover:bg-[#B5121A] text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
        >
          <Plus className="w-4 h-4" /> Yeni Ürün
        </Link>
      </div>

      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2a2a2a]">
                <th className="text-left text-xs text-gray-500 font-semibold uppercase tracking-wider px-5 py-3.5">Ürün</th>
                <th className="text-left text-xs text-gray-500 font-semibold uppercase tracking-wider px-5 py-3.5 hidden sm:table-cell">Kategori</th>
                <th className="text-left text-xs text-gray-500 font-semibold uppercase tracking-wider px-5 py-3.5 hidden md:table-cell">Alt Kategori</th>
                <th className="text-left text-xs text-gray-500 font-semibold uppercase tracking-wider px-5 py-3.5">Fiyat</th>
                <th className="text-left text-xs text-gray-500 font-semibold uppercase tracking-wider px-5 py-3.5 hidden lg:table-cell">Öne Çıkan</th>
                <th className="px-5 py-3.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2a2a]">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-gray-600 py-12 text-sm">
                    Henüz ürün eklenmemiş.{" "}
                    <Link href="/admin/urunler/yeni" className="text-[#E4171E] hover:underline">İlk ürünü ekle</Link>
                  </td>
                </tr>
              ) : products.map((p) => (
                <tr key={p.id} className="hover:bg-[#111111] transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#111111] rounded-lg overflow-hidden shrink-0">
                        {p.image ? (
                          <Image src={p.image} alt={p.name} width={40} height={40} className="w-full h-full object-contain p-1" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-700 text-xs">DS</div>
                        )}
                      </div>
                      <span className="text-white text-sm font-medium line-clamp-1">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden sm:table-cell">
                    <span className="text-gray-400 text-xs">{p.category.name}</span>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    {p.subcategory ? (
                      <span className="bg-[#E4171E]/10 text-[#E4171E] text-xs px-2 py-0.5 rounded-full">{p.subcategory}</span>
                    ) : <span className="text-gray-600 text-xs">—</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-[#E4171E] font-semibold text-sm">{formatPrice(p.price)}</span>
                  </td>
                  <td className="px-5 py-3.5 hidden lg:table-cell">
                    {p.featured ? (
                      <span className="flex items-center gap-1 text-yellow-400 text-xs"><Star className="w-3 h-3 fill-current" /> Evet</span>
                    ) : <span className="text-gray-600 text-xs">—</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2 justify-end">
                      <Link href={`/admin/urunler/${p.id}`} className="p-1.5 text-gray-400 hover:text-white hover:bg-[#2a2a2a] rounded-lg transition-colors">
                        <Pencil className="w-4 h-4" />
                      </Link>
                      <DeleteProductButton id={p.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
