import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Phone } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import ProductImageGallery from "@/components/ProductImageGallery";

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
    orderBy: { createdAt: "asc" },
  });

  const images: string[] = (() => {
    try { return JSON.parse(product.images || "[]"); } catch { return []; }
  })();
  if (images.length === 0 && product.image) images.push(product.image);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-8 flex-wrap">
        <Link href="/" className="hover:text-white transition-colors">Ana Sayfa</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/katalog" className="hover:text-white transition-colors">Katalog</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href={`/katalog/${slug}`} className="hover:text-white transition-colors">{product.category.name}</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-200 line-clamp-1">{product.name}</span>
      </div>

      {/* Product card */}
      <div className="bg-white rounded-2xl p-6 lg:p-10 mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Gallery */}
          <ProductImageGallery images={images} name={product.name} />

          {/* Details */}
          <div className="flex flex-col justify-center">
            <div className="text-xs font-semibold text-[#E4171E] uppercase tracking-widest mb-2">
              {product.category.name}
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4 leading-tight">{product.name}</h1>

            {product.description && (
              <p className="text-gray-600 text-base leading-relaxed mb-6">{product.description}</p>
            )}

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6">
              <div className="text-gray-500 text-sm mb-1">Fiyat</div>
              <div className="text-3xl font-black text-[#E4171E]">{formatPrice(product.price)}</div>
              {product.price == null && (
                <div className="text-gray-400 text-xs mt-1">Fiyat bilgisi için lütfen arayınız</div>
              )}
              {product.stock === 0 && (
                <div className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-200 text-gray-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
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
                className="flex-1 flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3.5 rounded-xl transition-colors"
              >
                <Phone className="w-4 h-4" />
                0533 843 06 45
              </a>
            </div>

            <p className="text-gray-400 text-xs mt-4 text-center">%100 Orijinal Pioneer — Yetkili Bayi Garantisi</p>
          </div>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div className="mt-4">
          <h2 className="text-2xl font-black text-white mb-6">Benzer Ürünler</h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {related.map((p) => (
              <Link key={p.id} href={`/katalog/${p.category.slug}/${p.id}`} className="group">
                <div className="bg-white border border-gray-200 group-hover:border-[#E4171E]/50 rounded-xl overflow-hidden transition-all group-hover:shadow-md">
                  <div className="aspect-square relative bg-gray-50">
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="w-full h-full object-contain p-3" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-200 text-xs font-bold">DS</div>
                    )}
                  </div>
                  <div className="p-3 border-t border-gray-100">
                    <div className="text-gray-900 text-sm font-semibold line-clamp-1 group-hover:text-[#E4171E] transition-colors">{p.name}</div>
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
