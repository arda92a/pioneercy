import { MapPin, Phone, Clock } from "lucide-react";

export default function IletisimPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-white mb-3">İletişim</h1>
        <p className="text-gray-400">D.S. Electronics — Pioneer Kıbrıs Yetkili Ana Bayii</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Contact cards */}
        <div className="space-y-5">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 flex gap-4">
            <div className="w-11 h-11 bg-[#E4171E]/10 border border-[#E4171E]/20 rounded-xl flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-[#E4171E]" />
            </div>
            <div>
              <div className="text-white font-semibold mb-1">Adres</div>
              <div className="text-gray-400 text-sm leading-relaxed">
                Kızılay Meral Birinci Sokak No: 20<br />
                Taşkınköy Mahallesi<br />
                Lefkoşa / KKTC
              </div>
            </div>
          </div>

          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 flex gap-4">
            <div className="w-11 h-11 bg-[#E4171E]/10 border border-[#E4171E]/20 rounded-xl flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5 text-[#E4171E]" />
            </div>
            <div>
              <div className="text-white font-semibold mb-2">Telefon</div>
              <a href="tel:05338750515" className="block text-gray-400 hover:text-white text-sm transition-colors mb-1">
                0533 875 05 15
              </a>
              <a href="tel:05338430645" className="block text-gray-400 hover:text-white text-sm transition-colors">
                0533 843 06 45
              </a>
            </div>
          </div>

          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 flex gap-4">
            <div className="w-11 h-11 bg-[#E4171E]/10 border border-[#E4171E]/20 rounded-xl flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-[#E4171E]" />
            </div>
            <div>
              <div className="text-white font-semibold mb-2">Çalışma Saatleri</div>
              <div className="text-gray-400 text-sm space-y-1">
                <div className="flex justify-between gap-8"><span>Pazartesi – Cumartesi</span><span>09:00 – 18:00</span></div>
                <div className="flex justify-between gap-8"><span>Pazar</span><span className="text-gray-600">Kapalı</span></div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <a
              href="tel:05338750515"
              className="flex-1 flex items-center justify-center gap-2 bg-[#E4171E] hover:bg-[#B5121A] text-white font-semibold py-3.5 rounded-xl transition-colors text-sm"
            >
              <Phone className="w-4 h-4" /> Hemen Ara
            </a>
          </div>
        </div>

        {/* Map placeholder */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl overflow-hidden min-h-[400px] flex flex-col">
          <iframe
            title="D.S. Electronics Konum"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3261.123456789!2d33.38!3d35.18!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzXCsDEwJzQ4LjAiTiAzM8KwMjInNDguMCJF!5e0!3m2!1str!2str!4v1234567890"
            className="w-full flex-1 min-h-[400px] grayscale brightness-75"
            style={{ border: 0, filter: "invert(90%) hue-rotate(180deg)" }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </div>
  );
}
