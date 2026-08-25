"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu, X, Phone } from "lucide-react";

const navLinks = [
  { href: "/", label: "Ana Sayfa" },
  { href: "/katalog", label: "Katalog" },
  { href: "/iletisim", label: "İletişim" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-[#0d0d0d] border-b border-[#2a2a2a]">
      {/* Top bar */}
      <div className="bg-[#E4171E] py-1.5 px-4 text-center text-xs text-white font-medium tracking-wide">
        Pioneer Kıbrıs Yetkili Ana Bayii — D.S. Electronics
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg overflow-hidden group-hover:opacity-90 transition-opacity">
              <Image src="/logo.jpg" alt="D.S. Electronics" width={40} height={40} className="w-full h-full object-cover" />
            </div>
            <div className="hidden sm:block">
              <div className="text-white font-bold text-base leading-tight">D.S. Electronics</div>
              <div className="text-[#E4171E] text-xs font-medium">Pioneer Yetkili Ana Bayi</div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-[#1a1a1a] rounded-lg transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Phone + hamburger */}
          <div className="flex items-center gap-3">
            <a
              href="tel:05338750515"
              className="hidden sm:flex items-center gap-2 bg-[#E4171E] hover:bg-[#B5121A] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span>Ara</span>
            </a>
            <button
              className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
              onClick={() => setOpen(!open)}
              aria-label="Menü"
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-[#2a2a2a] bg-[#0d0d0d]">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-[#1a1a1a] rounded-lg transition-colors"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <a
              href="tel:05338750515"
              className="flex items-center gap-2 bg-[#E4171E] text-white text-sm font-medium px-3 py-2.5 rounded-lg mt-2"
            >
              <Phone className="w-4 h-4" />
              0533 875 05 15
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
