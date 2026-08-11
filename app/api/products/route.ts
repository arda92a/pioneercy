import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const featured = searchParams.get("featured");

  const products = await prisma.product.findMany({
    where: {
      ...(category ? { category: { slug: category } } : {}),
      ...(featured === "true" ? { featured: true } : {}),
    },
    include: { category: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });

  const data = await req.json();
  const { name, description, price, image, categoryId, featured } = data;

  if (!name || !categoryId) {
    return NextResponse.json({ error: "İsim ve kategori zorunludur" }, { status: 400 });
  }

  const product = await prisma.product.create({
    data: {
      name: String(name),
      description: description ? String(description) : null,
      price: price ? Number(price) : null,
      image: image ? String(image) : null,
      categoryId: Number(categoryId),
      featured: Boolean(featured),
    },
    include: { category: true },
  });

  return NextResponse.json(product, { status: 201 });
}
