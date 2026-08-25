import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import HeroImagesForm from "@/components/HeroImagesForm";

export const dynamic = "force-dynamic";

export default async function AnaSayfaGorselleriPage() {
  const categories = await prisma.category.findMany({
    orderBy: { id: "asc" },
    select: { id: true, name: true, slug: true, image: true },
  });

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/admin" className="hover:text-white transition-colors">Dashboard</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-white">Ana Sayfa Görselleri</span>
      </div>
      <h1 className="text-2xl font-black text-white mb-2">Ana Sayfa Görselleri</h1>
      <p className="text-gray-500 text-sm mb-8">
        Ana sayfadaki kategori slider'ında görünen görselleri buradan değiştirebilirsiniz.
        Yüklediğiniz görseller ürün görsellerinden bağımsızdır.
      </p>

      <HeroImagesForm categories={categories} />
    </div>
  );
}
