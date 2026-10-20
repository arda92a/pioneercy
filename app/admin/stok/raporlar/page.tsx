import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Download } from "lucide-react";
import { addTo, customerBalances, nonZero, type CurrencyTotals } from "@/lib/stok/queries";
import { formatDateTime, formatDay, formatMoney, todayText } from "@/lib/stok/format";
import { Badge, Card, Empty, PageHeader, Stat, Table, Totals, btnPrimary, inputCls, tdCls, thCls } from "@/components/stok/ui";
import AutoFilterForm from "@/components/stok/AutoFilterForm";

const TABS = [
  ["ozet", "Özet"], ["urun", "Ürün bazlı satışlar"], ["bakiye", "Cari bakiyeler"], ["kritik", "Kritik stok"], ["hareket", "Stok hareketleri"],
] as const;

export default async function ReportsPage({ searchParams }: {
  searchParams: Promise<{ bolum?: string; marka?: string; model?: string; yil?: string; baslangic?: string; bitis?: string }>;
}) {
  const sp = await searchParams;
  const tab = TABS.some(([k]) => k === sp.bolum) ? sp.bolum! : "ozet";
  const tabHref = (k: string) => `/admin/stok/raporlar?bolum=${k}`;

  return (
    <div>
      <PageHeader
        title="Raporlar"
        crumbs={[{ href: "/admin/stok/raporlar", label: "Raporlar" }]}
        actions={<a href="/admin/stok/raporlar/excel" className={btnPrimary}><Download className="w-4 h-4" /> Tüm veriyi Excel&apos;e aktar</a>}
      />
      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map(([k, label]) => (
          <Link key={k} href={tabHref(k)}
            className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${tab === k ? "bg-[#E4171E] text-white" : "bg-[#1a1a1a] border border-[#2a2a2a] text-gray-400 hover:text-white"}`}>
            {label}
          </Link>
        ))}
      </div>
      {tab === "ozet" && <Summary />}
      {tab === "urun" && <ProductSales {...sp} />}
      {tab === "bakiye" && <Balances />}
      {tab === "kritik" && <LowStock />}
      {tab === "hareket" && <Movements {...sp} />}
    </div>
  );
}

async function Summary() {
  const month = todayText().slice(0, 7);
  const [sales, payments] = await Promise.all([
    prisma.sale.findMany({ where: { cancelled: false }, include: { returns: { select: { total: true } } } }),
    prisma.payment.findMany(),
  ]);
  const salesAll: CurrencyTotals = {}, salesMonth: CurrencyTotals = {}, payAll: CurrencyTotals = {}, payMonth: CurrencyTotals = {};
  const byMonth = new Map<string, { sales: CurrencyTotals; payments: CurrencyTotals; count: number }>();
  const monthRow = (m: string) => {
    if (!byMonth.has(m)) byMonth.set(m, { sales: {}, payments: {}, count: 0 });
    return byMonth.get(m)!;
  };
  for (const s of sales) {
    const net = s.total - s.returns.reduce((a, r) => a + r.total, 0);
    addTo(salesAll, s.currency, net);
    if (s.date.startsWith(month)) addTo(salesMonth, s.currency, net);
    const row = monthRow(s.date.slice(0, 7));
    addTo(row.sales, s.currency, net);
    row.count++;
  }
  for (const p of payments) {
    addTo(payAll, p.currency, p.amount);
    if (p.date.startsWith(month)) addTo(payMonth, p.currency, p.amount);
    addTo(monthRow(p.date.slice(0, 7)).payments, p.currency, p.amount);
  }
  const months = [...byMonth.entries()].sort(([a], [b]) => b.localeCompare(a));
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="Bu ay satış" value={<Totals totals={salesMonth} empty="0" />} />
        <Stat label="Bu ay tahsilat" value={<Totals totals={payMonth} empty="0" />} />
        <Stat label="Toplam satış" value={<Totals totals={salesAll} empty="0" />} hint="İadeler düşülmüş" />
        <Stat label="Toplam tahsilat" value={<Totals totals={payAll} empty="0" />} />
      </div>
      <Card title="Aylık özet" padded={false}>
        {months.length === 0 ? <Empty>Henüz satış yok.</Empty> : (
          <Table head={<tr><th className={thCls}>Ay</th><th className={thCls}>Satış adedi</th><th className={thCls}>Net satış</th><th className={thCls}>Tahsilat</th></tr>}>
            {months.map(([m, row]) => (
              <tr key={m}><td className={tdCls}>{m.split("-").reverse().join(".")}</td><td className={tdCls}>{row.count}</td><td className={tdCls}><Totals totals={row.sales} /></td><td className={tdCls}><Totals totals={row.payments} /></td></tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}

async function ProductSales({ marka = "", model = "", yil = "", baslangic = "", bitis = "" }: { marka?: string; model?: string; yil?: string; baslangic?: string; bitis?: string }) {
  const lines = await prisma.saleLine.findMany({
    where: { sale: { cancelled: false, ...(baslangic || bitis ? { date: { ...(baslangic ? { gte: baslangic } : {}), ...(bitis ? { lte: bitis } : {}) } } : {}) } },
    include: { sale: { include: { customer: true } }, stockItem: { include: { fits: true } } },
  });
  const lc = (s: string) => s.toLocaleLowerCase("tr");
  const year = Number(yil) || null;
  const rows = lines
    .filter((l) => (!marka || lc(l.stockItem.brand).includes(lc(marka)))
      && (!model || lc(l.stockItem.model).includes(lc(model)))
      && (!year || l.stockItem.fits.some((f) => (!f.yearFrom || f.yearFrom <= year) && (!f.yearTo || f.yearTo >= year))))
    .sort((a, b) => b.sale.date.localeCompare(a.sale.date) || b.sale.code.localeCompare(a.sale.code));
  const qty = rows.reduce((s, r) => s + r.quantity, 0);
  const totals: CurrencyTotals = {};
  for (const r of rows) addTo(totals, r.sale.currency, r.lineTotal);

  return (
    <Card padded={false}>
      <AutoFilterForm className="grid grid-cols-2 md:grid-cols-[1fr_1fr_120px_170px_170px] gap-3 p-4 border-b border-[#2a2a2a]">
        <input type="hidden" name="bolum" value="urun" />
        <input name="marka" defaultValue={marka} placeholder="Marka" className={inputCls} />
        <input name="model" defaultValue={model} placeholder="Model" className={inputCls} />
        <input name="yil" defaultValue={yil} placeholder="Araç yılı" className={inputCls} />
        <input type="date" name="baslangic" defaultValue={baslangic} className={inputCls} aria-label="Başlangıç" />
        <input type="date" name="bitis" defaultValue={bitis} className={inputCls} aria-label="Bitiş" />
      </AutoFilterForm>
      <div className="px-5 py-3 text-sm text-gray-400 border-b border-[#2a2a2a]">{rows.length} satır · {qty} adet · <Totals totals={totals} empty="0" /></div>
      {rows.length === 0 ? <Empty>Kayıt yok.</Empty> : (
        <Table head={<tr><th className={thCls}>Tarih</th><th className={thCls}>Satış</th><th className={thCls}>Cari</th><th className={thCls}>Ürün</th><th className={thCls}>Adet</th><th className={`${thCls} text-right`}>Birim</th><th className={`${thCls} text-right`}>Toplam</th></tr>}>
          {rows.map((r) => (
            <tr key={r.id} className="hover:bg-[#111111]">
              <td className={`${tdCls} whitespace-nowrap`}>{formatDay(r.sale.date)}</td>
              <td className={tdCls}><Link href={`/admin/stok/satislar/${r.saleId}`} className="text-[#E4171E] hover:underline">{r.sale.code}</Link></td>
              <td className={tdCls}>{r.sale.customer.name}</td>
              <td className={tdCls}>{r.stockItem.brand} {r.stockItem.model}<div className="text-gray-600 text-xs">{r.stockItem.code} · {r.name}</div></td>
              <td className={tdCls}>{r.quantity}</td>
              <td className={`${tdCls} text-right whitespace-nowrap`}>{formatMoney(r.unitPrice, r.sale.currency)}</td>
              <td className={`${tdCls} text-right whitespace-nowrap`}>{formatMoney(r.lineTotal, r.sale.currency)}</td>
            </tr>
          ))}
        </Table>
      )}
    </Card>
  );
}

async function Balances() {
  const [balances, customers] = await Promise.all([customerBalances(prisma), prisma.customer.findMany()]);
  const rows = customers
    .map((c) => ({ c, bal: nonZero(balances.get(c.id) ?? {}) }))
    .filter((r) => r.bal.length)
    .sort((a, b) => a.c.name.localeCompare(b.c.name, "tr"));
  return (
    <Card padded={false}>
      {rows.length === 0 ? <Empty>Açık bakiyesi olan cari yok.</Empty> : (
        <Table head={<tr><th className={thCls}>Cari</th><th className={thCls}>Telefon</th><th className={`${thCls} text-right`}>Bakiye</th></tr>}>
          {rows.map(({ c, bal }) => (
            <tr key={c.id} className="hover:bg-[#111111]">
              <td className={tdCls}><Link href={`/admin/stok/cariler/${c.id}`} className="text-white hover:text-[#E4171E]">{c.name}</Link><div className="text-gray-600 text-xs">{c.code}</div></td>
              <td className={tdCls}>{c.phone ?? "—"}</td>
              <td className={`${tdCls} text-right`}><Totals totals={bal} /></td>
            </tr>
          ))}
        </Table>
      )}
    </Card>
  );
}

async function LowStock() {
  const items = (await prisma.stockItem.findMany({ where: { active: true }, orderBy: [{ quantity: "asc" }, { brand: "asc" }] }))
    .filter((i) => i.quantity <= i.minQuantity);
  return (
    <Card padded={false}>
      {items.length === 0 ? <Empty>Kritik seviyede ürün yok.</Empty> : (
        <Table head={<tr><th className={thCls}>Ürün</th><th className={thCls}>Kategori</th><th className={thCls}>Mevcut</th><th className={thCls}>Minimum</th><th className={thCls} /></tr>}>
          {items.map((i) => (
            <tr key={i.id} className="hover:bg-[#111111]">
              <td className={tdCls}><Link href={`/admin/stok/kartlar/${i.id}`} className="text-white hover:text-[#E4171E]">{i.brand} {i.model}</Link><div className="text-gray-600 text-xs">{i.code} · {i.name}</div></td>
              <td className={tdCls}>{i.category}</td>
              <td className={tdCls}><Badge tone={i.quantity === 0 ? "red" : "yellow"}>{i.quantity}</Badge></td>
              <td className={tdCls}>{i.minQuantity}</td>
              <td className={`${tdCls} text-right`}><Link href={`/admin/stok/girisler/yeni?urun=${i.id}`} className="text-[#E4171E] text-xs hover:underline">Stok girişi yap</Link></td>
            </tr>
          ))}
        </Table>
      )}
    </Card>
  );
}

async function Movements({ baslangic = "", bitis = "" }: { baslangic?: string; bitis?: string }) {
  const movements = await prisma.stockMovement.findMany({
    where: baslangic || bitis ? { date: { ...(baslangic ? { gte: new Date(`${baslangic}T00:00:00`) } : {}), ...(bitis ? { lte: new Date(`${bitis}T23:59:59`) } : {}) } } : {},
    include: { stockItem: true, user: true },
    orderBy: [{ date: "desc" }, { id: "desc" }],
    take: 500,
  });
  return (
    <Card padded={false}>
      <AutoFilterForm className="flex flex-wrap items-end gap-3 p-4 border-b border-[#2a2a2a]">
        <input type="hidden" name="bolum" value="hareket" />
        <input type="date" name="baslangic" defaultValue={baslangic} className={`${inputCls} !w-auto`} aria-label="Başlangıç" />
        <input type="date" name="bitis" defaultValue={bitis} className={`${inputCls} !w-auto`} aria-label="Bitiş" />
        <span className="text-xs text-gray-600 py-3">En fazla son 500 hareket gösterilir.</span>
      </AutoFilterForm>
      {movements.length === 0 ? <Empty>Hareket yok.</Empty> : (
        <Table head={<tr><th className={thCls}>Tarih</th><th className={thCls}>Ürün</th><th className={thCls}>İşlem</th><th className={thCls}>Belge</th><th className={thCls}>Miktar</th><th className={thCls}>Kullanıcı</th></tr>}>
          {movements.map((m) => (
            <tr key={m.id} className="hover:bg-[#111111]">
              <td className={`${tdCls} whitespace-nowrap`}>{formatDateTime(m.date)}</td>
              <td className={tdCls}><Link href={`/admin/stok/kartlar/${m.stockItemId}`} className="text-white hover:text-[#E4171E]">{m.stockItem.brand} {m.stockItem.model}</Link><div className="text-gray-600 text-xs">{m.stockItem.code}</div></td>
              <td className={tdCls}>{m.type}{m.note && <div className="text-gray-600 text-xs">{m.note}</div>}</td>
              <td className={`${tdCls} whitespace-nowrap`}>{m.ref}</td>
              <td className={tdCls}><span className={m.quantity > 0 ? "text-emerald-400 font-semibold" : "text-red-400 font-semibold"}>{m.quantity > 0 ? `+${m.quantity}` : m.quantity}</span></td>
              <td className={tdCls}>{m.user?.username ?? "—"}</td>
            </tr>
          ))}
        </Table>
      )}
    </Card>
  );
}
