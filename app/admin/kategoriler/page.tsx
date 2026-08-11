import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import AddCategoryForm from "@/components/AddCategoryForm";
import CategoryList from "@/components/CategoryList";

export const dynamic = "force-dynamic";

export default async function KategorilerPage() {
  const categories = await prisma.category.findMany({
    orderBy: { id: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/admin" className="hover:text-white transition-colors">Dashboard</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-white">Kategoriler</span>
      </div>
      <h1 className="text-2xl font-black text-white mb-8">Kategoriler</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Category list */}
        <div>
          <div className="bg-[#111111] border border-[#2a2a2a] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#2a2a2a]">
              <span className="text-white font-semibold text-sm">Mevcut Kategoriler</span>
            </div>
            <CategoryList categories={categories} />
          </div>
        </div>

        {/* Add form */}
        <div>
          <div className="bg-[#111111] border border-[#2a2a2a] rounded-2xl p-6">
            <h2 className="text-white font-semibold text-sm mb-5">Yeni Kategori Ekle</h2>
            <AddCategoryForm />
          </div>
        </div>
      </div>
    </div>
  );
}
