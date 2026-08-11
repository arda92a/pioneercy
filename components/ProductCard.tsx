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
      <div className="bg-white rounded-xl overflow-hidden border border-gray-200 group-hover:border-[#E4171E]/60 group-hover:shadow-md card-hover h-full flex flex-col transition-all">
        {/* Image */}
        <div className="relative aspect-[4/3] bg-gray-50 overflow-hidden">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              className={`object-contain p-4 group-hover:scale-105 transition-transform duration-300 ${outOfStock ? "opacity-40" : ""}`}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-black text-gray-200">DS</span>
            </div>
          )}
          {outOfStock && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-black/60 text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                Stok Yok
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1 border-t border-gray-100">
          <h3 className="text-gray-900 font-semibold text-sm leading-tight group-hover:text-[#E4171E] transition-colors line-clamp-2">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-gray-500 text-xs mt-1.5 line-clamp-2 flex-1">{product.description}</p>
          )}
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-[#E4171E] font-bold text-base">{formatPrice(product.price)}</span>
            {outOfStock && <span className="text-gray-400 text-xs">Stok Yok</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}
