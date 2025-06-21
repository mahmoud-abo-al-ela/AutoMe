import { checkUser } from "@/lib/checkUser";
import { notFound } from "next/navigation";
import AdminSidebar from "@/app/(admin)/admin/_components/AdminSidebar";

export default async function AdminLayout({ children }) {
  const user = await checkUser();
  console.log(user);
  if (!user || user.role !== "ADMIN") {
    notFound();
  }
  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main
        className="flex-1 transition-all duration-300 ease-in-out"
        style={{ marginLeft: "var(--sidebar-width, 0)" }}
      >
        <div className="md:hidden h-16" />
        <div className="p-4 md:p-6 animate-in fade-in duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
