import AdminSidebar from "@/components/AdminSidebar";
import AdminSessionProvider from "@/components/AdminSessionProvider";
import AdminThemeProvider from "@/components/AdminThemeProvider";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminSessionProvider>
      <AdminThemeProvider>
        <div className="min-h-screen bg-[#0a0a0a] flex">
          <AdminSidebar />
          <main className="flex-1 ml-0 lg:ml-64 p-6 lg:p-8">{children}</main>
        </div>
      </AdminThemeProvider>
    </AdminSessionProvider>
  );
}
