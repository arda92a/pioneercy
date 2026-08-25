"use client";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

export interface HeroSlide {
  slug: string;
  name: string;
  description: string | null;
  image: string;
}

export default function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback(
    (i: number) => setIndex(((i % slides.length) + slides.length) % slides.length),
    [slides.length]
  );

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), 5000);
    return () => clearInterval(timer);
  }, [paused, slides.length]);

  if (slides.length === 0) return null;

  const active = slides[index];

  return (
    <section
      className="relative min-h-[85vh] flex items-end pioneer-gradient overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Background slides */}
      {slides.map((s, i) => (
        <Link
          key={s.slug}
          href={`/katalog/${s.slug}`}
          aria-label={`${s.name} kategorisine git`}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            i === index ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          aria-hidden={i !== index}
          tabIndex={i === index ? 0 : -1}
        >
          <Image
            src={s.image}
            alt={s.name}
            fill
            priority={i === 0}
            sizes="100vw"
            className={`object-cover transition-transform duration-[6000ms] ease-out ${
              i === index ? "scale-110" : "scale-100"
            }`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d]/75 to-[#0d0d0d]/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0d0d0d]/80 via-[#0d0d0d]/30 to-transparent" />
        </Link>
      ))}

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#E4171E 1px, transparent 1px), linear-gradient(to right, #E4171E 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <div className="inline-flex items-center gap-2 bg-[#E4171E]/10 border border-[#E4171E]/30 rounded-full px-4 py-1.5 text-[#E4171E] text-sm font-medium mb-6 animate-fade-in">
          <Star className="w-3.5 h-3.5 fill-current" />
          Kıbrıs Pioneer Yetkili Ana Bayii
        </div>

        <div key={active.slug} className="max-w-2xl animate-fade-up">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-4">
            {active.name}
          </h1>
          {active.description && (
            <p className="text-gray-300 text-lg leading-relaxed mb-8 line-clamp-2">{active.description}</p>
          )}
          <div className="flex flex-wrap gap-4">
            <Link
              href={`/katalog/${active.slug}`}
              className="inline-flex items-center gap-2 bg-[#E4171E] hover:bg-[#B5121A] text-white font-semibold px-8 py-3.5 rounded-xl transition-colors text-sm"
            >
              Kategoriyi Gör
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              href="/iletisim"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold px-8 py-3.5 rounded-xl transition-colors text-sm backdrop-blur-sm"
            >
              İletişime Geç
            </Link>
          </div>
        </div>

        {/* Dots */}
        {slides.length > 1 && (
          <div className="flex items-center gap-2 mt-12">
            {slides.map((s, i) => (
              <button
                key={s.slug}
                onClick={() => goTo(i)}
                aria-label={s.name}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-8 bg-[#E4171E]" : "w-1.5 bg-white/30 hover:bg-white/50"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={() => goTo(index - 1)}
            aria-label="Önceki"
            className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => goTo(index + 1)}
            aria-label="Sonraki"
            className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}
    </section>
  );
}
