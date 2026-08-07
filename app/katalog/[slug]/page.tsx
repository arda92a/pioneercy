import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/ProductCard";
import Link from "next/link";
import { ChevronRight, Filter } from "lucide-react";
import { notFound } from "next/navigation";

export const revalidate = 60;

export async function generateStaticParams() {
  const cats = await prisma.category.findMany({ select: { slug: true } });
  return cats.map((c) => ({ slug: c.slug }));
}

export default async function CategoryPage({ params, searchParams }: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sub?: string }>;
}) {
  const { slug } = await params;
  const { sub } = await searchParams;

  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      products: {
        where: sub ? { subcategory: sub } : {},
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!category) notFound();

  const subcategories = await prisma.product.findMany({
    where: { categoryId: category.id, subcategory: { not: null } },
    select: { subcategory: true },
    distinct: ["subcategory"],
  });

  const subList = subcategories.map((s) => s.subcategory!).filter(Boolean);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
        <Link href="/" className="hover:text-white transition-colors">Ana Sayfa</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/katalog" className="hover:text-white transition-colors">Katalog</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-white">{category.name}</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-white">{category.name}</h1>
          <p className="text-gray-500 mt-1">{category.products.length} ürün listeleniyor</p>
        </div>

        {/* Subcategory filter */}
        {subList.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/katalog/${slug}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                !sub ? "bg-[#E4171E] text-white" : "bg-[#1a1a1a] text-gray-400 hover:text-white border border-[#2a2a2a]"
              }`}
            >
              Tümü
            </Link>
            {subList.map((s) => (
              <Link
                key={s}
                href={`/katalog/${slug}?sub=${encodeURIComponent(s)}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  sub === s ? "bg-[#E4171E] text-white" : "bg-[#1a1a1a] text-gray-400 hover:text-white border border-[#2a2a2a]"
                }`}
              >
                {s}
              </Link>
            ))}
          </div>
        )}
      </div>

      {category.products.length === 0 ? (
        <div className="border border-dashed border-[#2a2a2a] rounded-xl py-20 text-center">
          <p className="text-gray-500">Bu kategoride henüz ürün bulunmuyor.</p>
          <Link href="/katalog" className="text-[#E4171E] text-sm mt-2 inline-block hover:underline">
            Tüm kataloğa dön
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {category.products.map((p) => (
            <ProductCard key={p.id} product={{ ...p, category }} />
          ))}
        </div>
      )}
    </div>
  );
}
