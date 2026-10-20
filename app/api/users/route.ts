import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const publicFields = { id: true, username: true, name: true, email: true, role: true, createdAt: true };

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });

  const users = await prisma.user.findMany({ select: publicFields });
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });

  const { name, username, password } = await req.json();
  const cleanUsername = String(username ?? "").trim();

  if (!cleanUsername || !password) {
    return NextResponse.json({ error: "Kullanıcı adı ve şifre zorunludur" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { username: cleanUsername } });
  if (existing) return NextResponse.json({ error: "Bu kullanıcı adı zaten kayıtlı" }, { status: 409 });

  const hashed = await bcrypt.hash(String(password), 12);

  const user = await prisma.user.create({
    data: { username: cleanUsername, name: name ? String(name) : null, password: hashed },
    select: publicFields,
  });

  return NextResponse.json(user, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID gerekli" }, { status: 400 });

  const userId = Number(id);
  const [movements, sales, payments] = await Promise.all([
    prisma.stockMovement.count({ where: { userId } }),
    prisma.sale.count({ where: { userId } }),
    prisma.payment.count({ where: { userId } }),
  ]);
  if (movements + sales + payments > 0) {
    return NextResponse.json(
      { error: "Bu kullanıcının stok/satış geçmişi var; geçmiş kayıtlar korunmak için silinemez." },
      { status: 409 },
    );
  }

  await prisma.user.delete({ where: { id: userId } });
  return NextResponse.json({ success: true });
}
