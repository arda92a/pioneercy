import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        login: { label: "Kullanıcı adı", type: "text" },
        password: { label: "Şifre", type: "password" },
      },
      async authorize(credentials) {
        const login = credentials?.login?.trim();
        if (!login || !credentials?.password) return null;

        const user = await prisma.user.findFirst({
          where: { OR: [{ username: login }, { email: login }] },
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        return { id: String(user.id), name: user.name ?? user.username, email: user.email, role: user.role };
      },
    }),
  ],
  pages: {
    signIn: "/admin/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = (user as { role?: string }).role;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { id?: string }).id = token.sub;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
