import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";

interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number | null;
  image: string | null;
  stock: number;
  category: { slug: string; name: string };
}

export default function ProductCard({ product }: { product: Product }) {
  const outOfStock = product.stock === 0;
  return (
    <Link href={`/katalog/${product.category.slug}/${product.id}`} className="group block">
      <div className="bg-[#1a1a1a] rounded-xl overflow-hidden border border-[#2a2a2a] group-hover:border-[#E4171E]/50 card-hover h-full flex flex-col">
        {/* Image */}
        <div className="relative aspect-[4/3] bg-[#111111] overflow-hidden">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              className={`object-contain p-4 group-hover:scale-105 transition-transform duration-300 ${outOfStock ? "opacity-50" : ""}`}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 text-[#E4171E]/30">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
              </div>
            </div>
          )}
          {outOfStock && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-black/70 text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider border border-white/20">
                Stok Yok
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          <h3 className="text-white font-semibold text-sm leading-tight group-hover:text-[#E4171E] transition-colors line-clamp-2">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-gray-500 text-xs mt-1.5 line-clamp-2 flex-1">{product.description}</p>
          )}
          <div className="mt-3 pt-3 border-t border-[#2a2a2a] flex items-center justify-between">
            <span className="text-[#E4171E] font-bold text-base">{formatPrice(product.price)}</span>
            {outOfStock && (
              <span className="text-gray-500 text-xs">Stok Yok</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
