"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface Props {
  images: string[];
  name: string;
}

export default function ProductImageGallery({ images, name }: Props) {
  const [current, setCurrent] = useState(0);
  const [dir, setDir] = useState<"right" | "left">("right");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);

  function prev() {
    setDir("left");
    setCurrent((i) => (i - 1 + images.length) % images.length);
  }
  function next() {
    setDir("right");
    setCurrent((i) => (i + 1) % images.length);
  }

  // Lock background scroll and allow Esc/arrow key navigation while the lightbox is open
  useEffect(() => {
    if (!lightboxOpen) return;
    document.body.style.overflow = "hidden";
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxOpen]);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current == null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(diff) < 40) return;
    if (diff > 0) prev();
    else next();
  }

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
      <div
        className="bg-white rounded-2xl border border-gray-200 aspect-square relative overflow-hidden group cursor-zoom-in"
        onClick={() => setLightboxOpen(true)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <img
          key={current}
          src={images[current]}
          alt={`${name} - ${current + 1}`}
          className={`w-full h-full object-contain p-8 ${dir === "right" ? "animate-slide-right" : "animate-slide-left"}`}
        />

        {images.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white shadow-md rounded-full flex items-center justify-center text-gray-700 hover:text-[#E4171E] transition-colors opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
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

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center animate-fade-in"
          onClick={() => setLightboxOpen(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            aria-label="Kapat"
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <img
            key={current}
            src={images[current]}
            alt={`${name} - ${current + 1}`}
            onClick={(e) => e.stopPropagation()}
            className={`max-w-[92vw] max-h-[85vh] object-contain select-none ${dir === "right" ? "animate-slide-right" : "animate-slide-left"}`}
          />

          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                aria-label="Önceki"
                className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/10 hover:bg-white/20 rounded-full items-center justify-center text-white transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                aria-label="Sonraki"
                className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/10 hover:bg-white/20 rounded-full items-center justify-center text-white transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/10 text-white text-xs px-3 py-1.5 rounded-full">
                {current + 1} / {images.length}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
