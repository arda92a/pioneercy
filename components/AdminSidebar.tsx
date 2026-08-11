"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { LayoutDashboard, Package, Plus, Users, LogOut, Menu, X, ExternalLink, Sun, Moon, FolderOpen } from "lucide-react";
import { useAdminTheme } from "@/components/AdminThemeProvider";

const navItems = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { href: "/admin/urunler", icon: Package, label: "Ürünler", exact: false, exclude: "/admin/urunler/yeni" },
  { href: "/admin/urunler/yeni", icon: Plus, label: "Yeni Ürün" },
  { href: "/admin/kategoriler", icon: FolderOpen, label: "Kategoriler" },
  { href: "/admin/kullanicilar", icon: Users, label: "Kullanıcılar" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { theme, toggle } = useAdminTheme();

  function isActive(href: string, exact?: boolean, exclude?: string) {
    if (exact) return pathname === href;
    if (exclude && pathname.startsWith(exclude)) return false;
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* Mobile hamburger — only visible when sidebar is closed */}
      {!open && (
        <button
          className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white"
          onClick={() => setOpen(true)}
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 bg-black/60 z-40" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-[#0d0d0d] border-r border-[#2a2a2a] z-50 flex flex-col
        transition-transform duration-300 lg:translate-x-0
        ${open ? "translate-x-0" : "-translate-x-full"}
      `}>
        {/* Header */}
        <div className="p-5 border-b border-[#2a2a2a]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#E4171E] rounded-lg flex items-center justify-center font-black text-white text-sm">
                DS
              </div>
              <div>
                <div className="text-white font-bold text-sm">D.S. Electronics</div>
                <div className="text-[#E4171E] text-xs">Admin Paneli</div>
              </div>
            </div>
            {/* Close button inside header — mobile only */}
            <button
              className="lg:hidden p-1.5 text-gray-500 hover:text-white transition-colors rounded-lg"
              onClick={() => setOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.exact, "exclude" in item ? item.exclude as string : undefined);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-[#E4171E] text-white font-medium"
                    : "text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[#2a2a2a] space-y-2">
          {/* Theme toggle */}
          <button
            onClick={toggle}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:text-white hover:bg-[#1a1a1a] transition-colors"
          >
            {theme === "dark" ? (
              <><Sun className="w-4 h-4 text-yellow-400" /><span>Aydınlık Mod</span></>
            ) : (
              <><Moon className="w-4 h-4 text-blue-400" /><span>Karanlık Mod</span></>
            )}
          </button>
          <a
            href="/"
            target="_blank"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:text-white hover:bg-[#1a1a1a] transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Siteyi Gör
          </a>
          <button
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:text-red-400 hover:bg-[#1a1a1a] transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Çıkış Yap
          </button>
        </div>
      </aside>
    </>
  );
}
