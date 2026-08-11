"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  images: string[];
  name: string;
}

export default function ProductImageGallery({ images, name }: Props) {
  const [current, setCurrent] = useState(0);

  const prev = () => setCurrent((i) => (i - 1 + images.length) % images.length);
  const next = () => setCurrent((i) => (i + 1) % images.length);

  if (images.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 aspect-square flex items-center justify-center">
        <span className="text-6xl font-black text-gray-200">DS</span>
      </div>
    );
  }

  return (
    <div>
      {/* Main image */}
      <div className="bg-white rounded-2xl border border-gray-200 aspect-square relative overflow-hidden group">
        <img
          key={current}
          src={images[current]}
          alt={`${name} - ${current + 1}`}
          className="w-full h-full object-contain p-8 animate-fade-in"
        />

        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white shadow-md rounded-full flex items-center justify-center text-gray-700 hover:text-[#E4171E] transition-colors opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white shadow-md rounded-full flex items-center justify-center text-gray-700 hover:text-[#E4171E] transition-colors opacity-0 group-hover:opacity-100"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            {/* Image counter */}
            <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
              {current + 1} / {images.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-16 h-16 shrink-0 rounded-xl border-2 overflow-hidden bg-white transition-colors ${
                i === current ? "border-[#E4171E]" : "border-gray-200 hover:border-gray-400"
              }`}
            >
              <img src={img} alt={`${i + 1}`} className="w-full h-full object-contain p-1" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
