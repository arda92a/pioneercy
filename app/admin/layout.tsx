import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";
import AdminSessionProvider from "@/components/AdminSessionProvider";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  return (
    <AdminSessionProvider>
      <div className="min-h-screen bg-[#0a0a0a] flex">
        <AdminSidebar />
        <main className="flex-1 ml-0 lg:ml-64 p-6 lg:p-8">{children}</main>
      </div>
    </AdminSessionProvider>
  );
}
