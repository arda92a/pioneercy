import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });

  const { id } = await params;
  const { name, description } = await req.json();
  if (!name) return NextResponse.json({ error: "Kategori adı zorunludur" }, { status: 400 });

  const category = await prisma.category.update({
    where: { id: Number(id) },
    data: {
      name: String(name),
      description: description ? String(description) : null,
    },
  });
  return NextResponse.json(category);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });

  const { id } = await params;
  const productCount = await prisma.product.count({ where: { categoryId: Number(id) } });
  if (productCount > 0) {
    return NextResponse.json(
      { error: `Bu kategoride ${productCount} ürün var. Önce ürünleri silin veya taşıyın.` },
      { status: 400 }
    );
  }

  await prisma.category.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
}
