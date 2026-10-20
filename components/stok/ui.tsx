import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { formatMoney } from "@/lib/stok/format";

export const inputCls =
  "w-full bg-[#0d0d0d] border border-[#3a3a3a] focus:border-[#E4171E] text-white placeholder-gray-600 rounded-xl px-3.5 py-2.5 text-sm outline-none transition-colors";
export const labelCls = "block text-sm text-gray-400 mb-1.5";
export const btnPrimary =
  "inline-flex items-center justify-center gap-2 bg-[#E4171E] hover:bg-[#B5121A] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm";
export const btnSecondary =
  "inline-flex items-center justify-center gap-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-[#3a3a3a] text-white font-medium px-4 py-2.5 rounded-xl transition-colors text-sm";
export const btnSmall =
  "inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-[#3a3a3a] text-gray-300 hover:text-white hover:bg-[#2a2a2a] transition-colors";
export const thCls = "text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap";
export const tdCls = "px-4 py-3 text-sm text-gray-300 align-top";

export function PageHeader({
  title, subtitle, crumbs = [], actions,
}: {
  title: string;
  subtitle?: React.ReactNode;
  crumbs?: { href: string; label: string }[];
  actions?: React.ReactNode;
}) {
  const trail = [{ href: "/admin/stok", label: "Stok & Satış" }, ...crumbs];
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-3 flex-wrap print:hidden">
        {trail.map((c, i) => (
          <span key={c.href} className="flex items-center gap-2">
            {i > 0 && <ChevronRight className="w-3 h-3" />}
            <Link href={c.href} className="hover:text-white transition-colors">{c.label}</Link>
          </span>
        ))}
      </div>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">{title}</h1>
          {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function Card({
  title, actions, children, className = "", padded = true,
}: {
  title?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section className={`bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[#2a2a2a]">
          <h2 className="text-white font-semibold text-sm">{title}</h2>
          {actions}
        </div>
      )}
      <div className={padded ? "p-5" : ""}>{children}</div>
    </section>
  );
}

export function Stat({ label, value, hint, icon }: { label: string; value: React.ReactNode; hint?: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="text-gray-500 text-sm">{label}</div>
        {icon}
      </div>
      <div className="text-2xl font-black text-white">{value}</div>
      {hint && <div className="text-gray-600 text-xs mt-1">{hint}</div>}
    </div>
  );
}

const tones = {
  red: "bg-red-500/10 text-red-400 border-red-500/30",
  green: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  yellow: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  gray: "bg-gray-500/10 text-gray-400 border-gray-500/30",
  blue: "bg-sky-500/10 text-sky-400 border-sky-500/30",
};

export function Badge({ tone = "gray", children }: { tone?: keyof typeof tones; children: React.ReactNode }) {
  return <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border whitespace-nowrap ${tones[tone]}`}>{children}</span>;
}

/** Para birimi bazında tutarlar: "500,00 USD · 1.200,00 TRY" */
export function Totals({ totals, empty = "—" }: { totals: Record<string, number> | [string, number][]; empty?: string }) {
  const entries = (Array.isArray(totals) ? totals : Object.entries(totals)).filter(([, v]) => v !== 0);
  if (!entries.length) return <>{empty}</>;
  return (
    <span className="flex flex-col">
      {entries.map(([cur, v]) => <span key={cur}>{formatMoney(v, cur)}</span>)}
    </span>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="py-12 text-center text-gray-600 text-sm">{children}</div>;
}

export function Table({ head, children }: { head: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="border-b border-[#2a2a2a]">{head}</thead>
        <tbody className="divide-y divide-[#2a2a2a]">{children}</tbody>
      </table>
    </div>
  );
}

export function Notice({ tone = "red", children }: { tone?: "red" | "green" | "yellow"; children: React.ReactNode }) {
  const cls = {
    red: "bg-red-950/50 border-red-900/50 text-red-400",
    green: "bg-green-950/50 border-green-900/50 text-green-400",
    yellow: "bg-amber-950/40 border-amber-900/50 text-amber-400",
  }[tone];
  return <div className={`border text-sm px-4 py-3 rounded-xl ${cls}`}>{children}</div>;
}
