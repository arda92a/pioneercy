import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Phone, Tag } from "lucide-react";
import { formatPrice } from "@/lib/utils";

export const revalidate = 60;

export default async function ProductPage({ params }: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;

  const product = await prisma.product.findUnique({
    where: { id: Number(id) },
    include: { category: true },
  });

  if (!product || product.category.slug !== slug) notFound();

  const related = await prisma.product.findMany({
    where: { categoryId: product.categoryId, id: { not: product.id } },
    include: { category: true },
    take: 4,
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-8 flex-wrap">
        <Link href="/" className="hover:text-white transition-colors">Ana Sayfa</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/katalog" className="hover:text-white transition-colors">Katalog</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href={`/katalog/${slug}`} className="hover:text-white transition-colors">{product.category.name}</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-white line-clamp-1">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Image */}
        <div className="bg-[#111111] rounded-2xl border border-[#2a2a2a] aspect-square relative overflow-hidden">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-contain p-10"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-700">
              <span className="text-6xl font-black">DS</span>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col justify-center">
          {product.subcategory && (
            <div className="inline-flex items-center gap-1.5 bg-[#E4171E]/10 border border-[#E4171E]/30 text-[#E4171E] text-xs font-semibold px-3 py-1 rounded-full mb-4 w-fit uppercase tracking-wider">
              <Tag className="w-3 h-3" />
              {product.subcategory}
            </div>
          )}

          <h1 className="text-3xl sm:text-4xl font-black text-white mb-4 leading-tight">{product.name}</h1>

          {product.description && (
            <p className="text-gray-400 text-base leading-relaxed mb-6">{product.description}</p>
          )}

          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5 mb-6">
            <div className="text-gray-500 text-sm mb-1">Fiyat</div>
            <div className="text-3xl font-black text-[#E4171E]">{formatPrice(product.price)}</div>
            {product.price == null && (
              <div className="text-gray-500 text-xs mt-1">Fiyat bilgisi için lütfen arayınız</div>
            )}
            {product.stock === 0 && (
              <div className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-800 text-gray-400">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                Stok Yok
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="tel:05338750515"
              className="flex-1 flex items-center justify-center gap-2 bg-[#E4171E] hover:bg-[#B5121A] text-white font-semibold py-3.5 rounded-xl transition-colors"
            >
              <Phone className="w-4 h-4" />
              0533 875 05 15
            </a>
            <a
              href="tel:05338430645"
              className="flex-1 flex items-center justify-center gap-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-[#3a3a3a] text-white font-semibold py-3.5 rounded-xl transition-colors"
            >
              <Phone className="w-4 h-4" />
              0533 843 06 45
            </a>
          </div>

          <p className="text-gray-600 text-xs mt-4 text-center">%100 Orijinal Pioneer — Yetkili Bayi Garantisi</p>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div className="mt-20">
          <h2 className="text-2xl font-black text-white mb-6">Benzer Ürünler</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {related.map((p) => (
              <Link key={p.id} href={`/katalog/${p.category.slug}/${p.id}`} className="group">
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] group-hover:border-[#E4171E]/50 rounded-xl overflow-hidden card-hover">
                  <div className="aspect-square relative bg-[#111111]">
                    {p.image ? (
                      <Image src={p.image} alt={p.name} fill className="object-contain p-4" sizes="25vw" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-700 text-xs">Pioneer</div>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="text-white text-sm font-semibold line-clamp-1 group-hover:text-[#E4171E] transition-colors">{p.name}</div>
                    <div className="text-[#E4171E] text-sm font-bold mt-1">{formatPrice(p.price)}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
