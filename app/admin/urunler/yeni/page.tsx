import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import ProductForm from "@/components/ProductForm";

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({ orderBy: { id: "asc" } });

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/admin" className="hover:text-white transition-colors">Dashboard</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/admin/urunler" className="hover:text-white transition-colors">Ürünler</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-white">Yeni Ürün</span>
      </div>
      <h1 className="text-2xl font-black text-white mb-8">Yeni Ürün Ekle</h1>
      <ProductForm categories={categories} />
    </div>
  );
}
