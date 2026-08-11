import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id: Number(id) },
    include: { category: true },
  });
  if (!product) return NextResponse.json({ error: "Ürün bulunamadı" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });

  const { id } = await params;
  const data = await req.json();
  const { name, description, price, image, images, categoryId, featured, stock } = data;

  const product = await prisma.product.update({
    where: { id: Number(id) },
    data: {
      ...(name !== undefined && { name: String(name) }),
      ...(description !== undefined && { description: description ? String(description) : null }),
      ...(price !== undefined && { price: price !== "" ? Number(price) : null }),
      ...(image !== undefined && { image: image ? String(image) : null }),
      ...(images !== undefined && { images: String(images) }),
      ...(categoryId !== undefined && { categoryId: Number(categoryId) }),
      ...(featured !== undefined && { featured: Boolean(featured) }),
      ...(stock !== undefined && { stock: Number(stock) }),
    },
    include: { category: true },
  });

  return NextResponse.json(product);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });

  const { id } = await params;
  await prisma.product.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
}
