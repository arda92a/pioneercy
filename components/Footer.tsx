import Link from "next/link";
import { MapPin, Phone, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#0a0a0a] border-t border-[#2a2a2a] mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#E4171E] rounded-lg flex items-center justify-center font-black text-white text-lg">
                DS
              </div>
              <div>
                <div className="text-white font-bold text-base">D.S. Electronics</div>
                <div className="text-[#E4171E] text-xs">Pioneer Yetkili Ana Bayi</div>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              KKTC&apos;nin Pioneer Yetkili Ana Bayii olarak en kaliteli araç ses sistemlerini sunuyoruz.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Kategoriler</h3>
            <ul className="space-y-2">
              <li><Link href="/katalog/oto-teyp" className="text-gray-400 hover:text-[#E4171E] text-sm transition-colors">Oto Teyp & Multimedya</Link></li>
              <li><Link href="/katalog/hoparlor" className="text-gray-400 hover:text-[#E4171E] text-sm transition-colors">Hoparlör & Tweeter</Link></li>
              <li><Link href="/katalog/amplifikator" className="text-gray-400 hover:text-[#E4171E] text-sm transition-colors">Amplifikatör & Subwoofer</Link></li>
              <li><Link href="/katalog" className="text-gray-400 hover:text-[#E4171E] text-sm transition-colors">Tüm Ürünler</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">İletişim</h3>
            <ul className="space-y-3">
              <li className="flex gap-2 text-gray-400 text-sm">
                <MapPin className="w-4 h-4 mt-0.5 text-[#E4171E] shrink-0" />
                <span>Kızılay Meral Birinci Sokak No: 20, Taşkınköy Mahallesi, Lefkoşa / KKTC</span>
              </li>
              <li>
                <a href="tel:05338750515" className="flex gap-2 text-gray-400 hover:text-white text-sm transition-colors">
                  <Phone className="w-4 h-4 mt-0.5 text-[#E4171E] shrink-0" />
                  0533 875 05 15
                </a>
              </li>
              <li>
                <a href="tel:05338430645" className="flex gap-2 text-gray-400 hover:text-white text-sm transition-colors">
                  <Phone className="w-4 h-4 mt-0.5 text-[#E4171E] shrink-0" />
                  0533 843 06 45
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[#2a2a2a] flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-gray-600 text-xs">© {new Date().getFullYear()} D.S. Electronics. Tüm hakları saklıdır.</p>
          <p className="text-gray-600 text-xs">Pioneer Kıbrıs Yetkili Ana Bayii — Lefkoşa, KKTC</p>
        </div>
      </div>
    </footer>
  );
}
