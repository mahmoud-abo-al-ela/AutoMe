import type { Metadata } from "next";
import { checkUser, isSuperAdmin } from "@/lib/checkUser";
import { notFound } from "next/navigation";
import { Toaster } from "sonner";
import SuperAdminSidebar from "./_components/SuperAdminSidebar";

// Super-admin pages query the database during server render but, unlike tenant
// pages, never call getCurrentOrganization() (which reads headers() and forces
// dynamic rendering). Without this, Next tries to statically prerender them at
// build time and the DB calls fail wherever no live database is reachable (CI).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Super Admin",
  description: "Platform administration dashboard",
};

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await checkUser();

  // Must be authenticated
  if (!user) {
    notFound();
  }

  // Must be Admin
  if (user.role !== "ADMIN") {
    notFound();
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Toaster position="top-right" richColors />
      <SuperAdminSidebar user={user} />
      <main
        className="flex-1 transition-all duration-300 ease-in-out flex flex-col min-w-0"
        style={{ paddingLeft: "var(--sidebar-width, 0)" }}
      >
        {/* Mobile header spacer */}
        <div className="md:hidden h-16" />

        {/* Main content */}
        <div className="p-4 md:p-6 animate-in fade-in duration-500 flex-1 min-h-0">
          {children}
        </div>
      </main>
    </div>
  );
}
