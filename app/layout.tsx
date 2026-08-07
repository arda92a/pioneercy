import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "D.S. Electronics | Pioneer Kıbrıs Yetkili Ana Bayi",
  description:
    "D.S. Electronics — KKTC'nin Pioneer Yetkili Ana Bayii. Oto Teyp, Hoparlör, Amplifikatör ve Subwoofer sistemleri. Lefkoşa, KKTC.",
  keywords: "Pioneer, Kıbrıs, oto teyp, araba sesi, hoparlör, amplifikatör, KKTC",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className="h-full">
      <body className={`${inter.className} min-h-full flex flex-col bg-[#0d0d0d] text-white`}>
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
