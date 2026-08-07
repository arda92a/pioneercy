import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";
import path from "path";

const dbPath = path.resolve(process.cwd(), "prisma", "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  // Categories
  await prisma.category.upsert({
    where: { slug: "oto-teyp" },
    update: {},
    create: { name: "Oto Teyp & Multimedya Sistemleri", slug: "oto-teyp", description: "Apple CarPlay, Android Auto destekli multimedya sistemleri" },
  });
  await prisma.category.upsert({
    where: { slug: "hoparlor" },
    update: {},
    create: { name: "Hoparlör, Midrange & Tweeter Sistemleri", slug: "hoparlor", description: "Component ve koaksiyel hoparlör sistemleri" },
  });
  await prisma.category.upsert({
    where: { slug: "amplifikator" },
    update: {},
    create: { name: "Amplifikatör (Amfi) & Subwoofer Grupları", slug: "amplifikator", description: "Güçlü amfi ve subwoofer grupları" },
  });

  const cats = await prisma.category.findMany();
  const catMap = Object.fromEntries(cats.map((c) => [c.slug, c.id]));

  // Demo products
  const products = [
    { name: "Pioneer MVH-S325BT", description: "Bluetooth, USB, AUX, 4x50W. Basit ve kullanışlı dijital medya alıcısı.", price: 149, categoryId: catMap["oto-teyp"], subcategory: "Dijital Medya", featured: true, sortOrder: 1 },
    { name: "Pioneer AVH-Z5200DAB", description: "7\" dokunmatik ekran, Apple CarPlay, Android Auto, DAB+.", price: 449, categoryId: catMap["oto-teyp"], subcategory: "Multimedya", featured: true, sortOrder: 2 },
    { name: "Pioneer SPH-DA160DAB", description: "Apple CarPlay & Android Auto, 6.8\" WVGA ekran.", price: 289, categoryId: catMap["oto-teyp"], subcategory: "Multimedya", featured: false, sortOrder: 3 },
    { name: "Pioneer TS-G1320F", description: "2 yollu koaksiyel hoparlör, 250W maks., 13cm.", price: 39, categoryId: catMap["hoparlor"], subcategory: "Koaksiyel", featured: false, sortOrder: 1 },
    { name: "Pioneer TS-A1680F", description: "4 yollu koaksiyel hoparlör, 350W, 16cm.", price: 59, categoryId: catMap["hoparlor"], subcategory: "Koaksiyel", featured: true, sortOrder: 2 },
    { name: "Pioneer TS-C1310F", description: "Component hoparlör sistemi, 13cm, tweeter dahil.", price: 89, categoryId: catMap["hoparlor"], subcategory: "Component", featured: false, sortOrder: 3 },
    { name: "Pioneer GM-A3702", description: "2 kanal amfi, 500W maks. güç, kompakt tasarım.", price: 129, categoryId: catMap["amplifikator"], subcategory: "Amplifikatör", featured: true, sortOrder: 1 },
    { name: "Pioneer TS-WX130DA", description: "Aktif Subwoofer, 160W RMS, 8\", kompakt.", price: 179, categoryId: catMap["amplifikator"], subcategory: "Subwoofer", featured: true, sortOrder: 2 },
    { name: "Pioneer GM-D9605", description: "5 kanal amfi, 2400W maks., araba ses sistemi için ideal.", price: 349, categoryId: catMap["amplifikator"], subcategory: "Amplifikatör", featured: false, sortOrder: 3 },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { id: (await prisma.product.findFirst({ where: { name: p.name } }))?.id ?? 0 },
      update: {},
      create: p,
    });
  }

  // Admin user
  const hash = await bcrypt.hash("admin123!", 12);
  await prisma.user.upsert({
    where: { email: "admin@dselectronics.com" },
    update: {},
    create: { name: "Admin", email: "admin@dselectronics.com", password: hash },
  });

  console.log("✅ Seed tamamlandı!");
  console.log("🔑 Admin: admin@dselectronics.com / admin123!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
