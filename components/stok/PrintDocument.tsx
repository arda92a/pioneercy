import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PrintButton from "@/components/stok/PrintButton";
import { btnSecondary } from "@/components/stok/ui";

export default function PrintDocument({
  company, title, number, date, backHref, backLabel, children, footer,
}: {
  company: { name: string; logo: string };
  title: string;
  number: string;
  date: string;
  backHref: string;
  backLabel: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6 print:hidden">
        <PrintButton />
        <Link href={backHref} className={btnSecondary}><ArrowLeft className="w-4 h-4" /> {backLabel}</Link>
      </div>
      <article className="stok-doc bg-white text-gray-900 rounded-xl shadow-xl max-w-[210mm] mx-auto p-10 print:shadow-none print:rounded-none print:p-0 print:max-w-none">
        <header className="flex items-start justify-between gap-6 border-b-2 border-gray-900 pb-5 mb-6">
          <div className="flex items-center gap-4">
            {company.logo && <img src={company.logo} alt="" className="h-14 w-auto object-contain" />}
            <div>
              <div className="text-xl font-black">{company.name}</div>
              <div className="text-sm text-gray-600">{title}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">Belge no</div>
            <div className="text-lg font-bold">{number}</div>
            <div className="text-sm text-gray-600">{date}</div>
          </div>
        </header>
        {children}
        <footer className="flex justify-between border-t border-gray-300 mt-10 pt-3 text-xs text-gray-500">
          <span>{company.name}</span>
          {footer ?? <span>Belge no: {number}</span>}
        </footer>
      </article>
    </div>
  );
}

export function DocSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">{title}</div>
      {children}
    </div>
  );
}

export function DocInfo({ items }: { items: [string, React.ReactNode][] }) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
      {items.map(([k, v]) => (
        <div key={k}>
          <div className="text-xs text-gray-500">{k}</div>
          <div className="font-semibold">{v || "—"}</div>
        </div>
      ))}
    </div>
  );
}

export const docTh = "text-left text-xs font-bold uppercase text-gray-600 border-b-2 border-gray-300 py-2 pr-3";
export const docTd = "text-sm border-b border-gray-200 py-2 pr-3 align-top";
