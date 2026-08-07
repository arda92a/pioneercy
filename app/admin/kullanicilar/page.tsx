import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ChevronRight, Plus, Trash2, UserCircle } from "lucide-react";
import AddUserForm from "@/components/AddUserForm";
import DeleteUserButton from "@/components/DeleteUserButton";

export const revalidate = 0;

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/admin" className="hover:text-white transition-colors">Dashboard</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-white">Kullanıcılar</span>
      </div>

      <h1 className="text-2xl font-black text-white mb-8">Kullanıcılar</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User list */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
          <div className="p-5 border-b border-[#2a2a2a]">
            <h2 className="text-white font-semibold text-sm">Mevcut Kullanıcılar</h2>
          </div>
          <div className="divide-y divide-[#2a2a2a]">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-[#2a2a2a] rounded-full flex items-center justify-center">
                    <UserCircle className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <div className="text-white text-sm font-medium">{u.name ?? u.email}</div>
                    <div className="text-gray-500 text-xs">{u.email}</div>
                  </div>
                </div>
                <DeleteUserButton id={u.id} />
              </div>
            ))}
          </div>
        </div>

        {/* Add user form */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
          <h2 className="text-white font-semibold text-sm mb-5 flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#E4171E]" /> Yeni Kullanıcı Ekle
          </h2>
          <AddUserForm />
        </div>
      </div>
    </div>
  );
}
