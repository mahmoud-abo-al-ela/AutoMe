import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { checkUser } from "@/lib/checkUser";
import type { Locale } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { Toaster } from "sonner";
import SuperAdminSidebar from "./_components/SuperAdminSidebar";

// Super-admin pages query the database during server render but, unlike tenant
// pages, never call getCurrentOrganization() (which reads headers() and forces
// dynamic rendering). Without this, Next tries to statically prerender them at
// build time and the DB calls fail wherever no live database is reachable (CI).
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "superAdmin.meta" });

  return { title: t("title"), description: t("description") };
}

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
      <SuperAdminSidebar />
      <main
        className="flex-1 transition-all duration-300 ease-in-out flex flex-col min-w-0"
        // The sidebar is pinned to the inline-start edge, which is the
        // right-hand one in Arabic; a physical paddingLeft put the content
        // underneath it there.
        style={{ paddingInlineStart: "var(--sidebar-width, 0)" }}
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
