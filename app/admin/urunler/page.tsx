import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Pencil, Star } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import DeleteProductButton from "@/components/DeleteProductButton";

export const revalidate = 0;

export default async function AdminProductsPage() {
  const categories = await prisma.category.findMany({
    orderBy: { id: "asc" },
    include: {
      products: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const totalProducts = categories.reduce((sum, c) => sum + c.products.length, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white">Ürünler</h1>
          <p className="text-gray-500 text-sm mt-1">{totalProducts} ürün</p>
        </div>
        <Link
          href="/admin/urunler/yeni"
          className="flex items-center gap-2 bg-[#E4171E] hover:bg-[#B5121A] text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
        >
          <Plus className="w-4 h-4" /> Yeni Ürün
        </Link>
      </div>

      {totalProducts === 0 ? (
        <div className="text-center py-16 text-gray-600 text-sm">
          Henüz ürün eklenmemiş.{" "}
          <Link href="/admin/urunler/yeni" className="text-[#E4171E] hover:underline">İlk ürünü ekle</Link>
        </div>
      ) : (
        <div className="space-y-6">
          {categories.filter((c) => c.products.length > 0).map((cat) => (
            <div key={cat.id} className="bg-[#111111] border border-[#2a2a2a] rounded-2xl overflow-hidden">
              {/* Category header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#2a2a2a] bg-[#0d0d0d]">
                <span className="text-white font-semibold text-sm">{cat.name}</span>
                <span className="text-gray-600 text-xs">{cat.products.length} ürün</span>
              </div>

              {/* Products */}
              <div className="divide-y divide-[#1f1f1f]">
                {cat.products.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 px-4 py-3.5">
                    {/* Thumbnail */}
                    <div className="w-12 h-12 bg-[#1a1a1a] rounded-lg overflow-hidden shrink-0">
                      {p.image ? (
                        <img src={p.image} alt={p.name} className="w-full h-full object-contain p-1" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-700 text-[10px] font-bold">DS</div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-white text-sm font-medium leading-tight line-clamp-2">{p.name}</span>
                        {p.featured && <Star className="w-3.5 h-3.5 text-yellow-400 fill-current shrink-0" />}
                      </div>
                      <div className="text-[#E4171E] text-xs font-semibold mt-0.5">{formatPrice(p.price)}</div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Link
                        href={`/admin/urunler/${p.id}`}
                        className="p-2 text-gray-500 hover:text-white hover:bg-[#2a2a2a] rounded-lg transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>
                      <DeleteProductButton id={p.id} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
