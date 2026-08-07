import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import ProductForm from "@/components/ProductForm";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id: Number(id) } }),
    prisma.category.findMany({ orderBy: { id: "asc" } }),
  ]);

  if (!product) notFound();

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/admin" className="hover:text-white transition-colors">Dashboard</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/admin/urunler" className="hover:text-white transition-colors">Ürünler</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-white line-clamp-1">{product.name}</span>
      </div>
      <h1 className="text-2xl font-black text-white mb-8">Ürünü Düzenle</h1>
      <ProductForm categories={categories} initial={{ ...product, description: product.description ?? undefined, image: product.image ?? undefined, subcategory: product.subcategory ?? undefined }} />
    </div>
  );
}
