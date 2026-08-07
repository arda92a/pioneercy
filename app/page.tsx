import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/ProductCard";
import { ChevronRight, Cpu, Speaker, Zap, Star, Phone, MapPin } from "lucide-react";

const categories = [
  {
    slug: "oto-teyp",
    name: "Oto Teyp & Multimedya",
    desc: "Apple CarPlay, Android Auto ve 4K dokunmatik ekranlı multimedya sistemleri",
    icon: Cpu,
    gradient: "from-blue-900/20 to-[#1a1a1a]",
  },
  {
    slug: "hoparlor",
    name: "Hoparlör & Tweeter",
    desc: "Kristal netliğinde ses için component ve koaksiyel hoparlör sistemleri",
    icon: Speaker,
    gradient: "from-green-900/20 to-[#1a1a1a]",
  },
  {
    slug: "amplifikator",
    name: "Amplifikatör & Subwoofer",
    desc: "Güçlü bas ve yüksek güç çıkışı için amfi ve subwoofer grupları",
    icon: Zap,
    gradient: "from-[#E4171E]/10 to-[#1a1a1a]",
  },
];

export const revalidate = 60;

export default async function HomePage() {
  const featuredProducts = await prisma.product.findMany({
    where: { featured: true },
    include: { category: true },
    take: 6,
    orderBy: { sortOrder: "asc" },
  });

  const categoryCounts = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
  });

  const countMap = Object.fromEntries(categoryCounts.map((c) => [c.slug, c._count.products]));

  return (
    <>
      <section className="relative min-h-[85vh] flex items-center pioneer-gradient overflow-hidden">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(#E4171E 1px, transparent 1px), linear-gradient(to right, #E4171E 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
        <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-[#E4171E]/5 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#E4171E]/50 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-[#E4171E]/10 border border-[#E4171E]/30 rounded-full px-4 py-1.5 text-[#E4171E] text-sm font-medium mb-6">
              <Star className="w-3.5 h-3.5 fill-current" />
              Kıbrıs Pioneer Yetkili Ana Bayii
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-6">
              Araç Sesinizi{" "}
              <span className="text-[#E4171E]">Yeniden</span>{" "}
              Keşfedin
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed mb-8">
              D.S. Electronics olarak KKTC&apos;de Pioneer&apos;ın resmi yetkili ana bayii olarak
              en son oto teyp, hoparlör ve amplifikatör sistemlerini sunuyoruz.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/katalog"
                className="inline-flex items-center gap-2 bg-[#E4171E] hover:bg-[#B5121A] text-white font-semibold px-8 py-3.5 rounded-xl transition-colors text-sm"
              >
                Kataloğu Gör
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                href="/iletisim"
                className="inline-flex items-center gap-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white border border-[#3a3a3a] font-semibold px-8 py-3.5 rounded-xl transition-colors text-sm"
              >
                İletişime Geç
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#E4171E] py-4">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-3 gap-4 text-center text-white">
            <div><div className="font-black text-2xl sm:text-3xl">3</div><div className="text-xs sm:text-sm opacity-80">Kategori</div></div>
            <div><div className="font-black text-2xl sm:text-3xl">%100</div><div className="text-xs sm:text-sm opacity-80">Orijinal Ürün</div></div>
            <div><div className="font-black text-2xl sm:text-3xl">Yetkili</div><div className="text-xs sm:text-sm opacity-80">Ana Bayi</div></div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">Ürün Kategorileri</h2>
          <p className="text-gray-400">Pioneer&apos;ın tüm araç ses ekipmanlarını keşfedin</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link key={cat.slug} href={`/katalog/${cat.slug}`} className="group">
                <div className={`bg-gradient-to-br ${cat.gradient} border border-[#2a2a2a] group-hover:border-[#E4171E]/50 rounded-2xl p-7 h-full card-hover`}>
                  <div className="w-12 h-12 bg-[#E4171E]/10 border border-[#E4171E]/20 rounded-xl flex items-center justify-center mb-5 group-hover:bg-[#E4171E]/20 transition-colors">
                    <Icon className="w-6 h-6 text-[#E4171E]" />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2 group-hover:text-[#E4171E] transition-colors">{cat.name}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-4">{cat.desc}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 text-xs">{countMap[cat.slug] ?? 0} ürün</span>
                    <span className="text-[#E4171E] text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                      Gör <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {featuredProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl sm:text-4xl font-black text-white">Öne Çıkan Ürünler</h2>
              <p className="text-gray-400 mt-1">En çok tercih edilen Pioneer ürünleri</p>
            </div>
            <Link href="/katalog" className="hidden sm:flex items-center gap-1 text-[#E4171E] hover:text-[#B5121A] text-sm font-medium transition-colors">
              Tümünü Gör <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="bg-gradient-to-br from-[#E4171E]/10 to-[#1a1a1a] border border-[#E4171E]/20 rounded-2xl p-8 sm:p-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">Sorunuz mu var?</h2>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">Uzman ekibimiz en uygun Pioneer sistemini seçmenize yardımcı olacak.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="tel:05338750515" className="inline-flex items-center justify-center gap-2 bg-[#E4171E] hover:bg-[#B5121A] text-white font-semibold px-8 py-3.5 rounded-xl transition-colors">
              <Phone className="w-4 h-4" /> 0533 875 05 15
            </a>
            <Link href="/iletisim" className="inline-flex items-center justify-center gap-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-[#3a3a3a] text-white font-semibold px-8 py-3.5 rounded-xl transition-colors">
              <MapPin className="w-4 h-4" /> Bizi Bulun
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
