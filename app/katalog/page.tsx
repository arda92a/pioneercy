import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/ProductCard";
import Link from "next/link";
import { ChevronRight, Cpu, Speaker, Zap } from "lucide-react";

const categoryMeta: Record<string, { icon: React.ElementType; desc: string }> = {
  "oto-teyp": { icon: Cpu, desc: "Apple CarPlay, Android Auto destekli multimedya sistemleri" },
  "hoparlor": { icon: Speaker, desc: "Component ve koaksiyel hoparlör sistemleri" },
  "amplifikator": { icon: Zap, desc: "Güçlü amfi ve subwoofer grupları" },
};

export const revalidate = 60;

export default async function KatalogPage() {
  const categories = await prisma.category.findMany({
    include: {
      products: {
        take: 3,
        orderBy: { sortOrder: "asc" },
      },
      _count: { select: { products: true } },
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Link href="/" className="hover:text-white transition-colors">Ana Sayfa</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-white">Katalog</span>
        </div>
        <h1 className="text-4xl font-black text-white mb-3">Ürün Kataloğu</h1>
        <p className="text-gray-400">Pioneer&apos;ın tüm araç ses ekipmanları</p>
      </div>

      {/* Category sections */}
      <div className="space-y-16">
        {categories.map((cat) => {
          const meta = categoryMeta[cat.slug];
          const Icon = meta?.icon ?? Cpu;
          return (
            <div key={cat.id}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#E4171E]/10 border border-[#E4171E]/20 rounded-xl flex items-center justify-center">
                    <Icon className="w-5 h-5 text-[#E4171E]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{cat.name}</h2>
                    {meta && <p className="text-gray-500 text-sm">{meta.desc}</p>}
                  </div>
                </div>
                <Link
                  href={`/katalog/${cat.slug}`}
                  className="flex items-center gap-1 text-[#E4171E] hover:text-[#B5121A] text-sm font-medium transition-colors whitespace-nowrap"
                >
                  Tümü ({cat._count.products}) <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {cat.products.length === 0 ? (
                <div className="border border-dashed border-[#2a2a2a] rounded-xl py-10 text-center text-gray-600 text-sm">
                  Bu kategoride henüz ürün bulunmuyor.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {cat.products.map((p) => (
                    <ProductCard key={p.id} product={{ ...p, category: cat }} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
