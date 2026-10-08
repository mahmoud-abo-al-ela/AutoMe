import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { checkUser } from "@/lib/checkUser";
import type { Locale } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { SiteToaster } from "@/components/brand/SiteToaster";
import { AdminFrame } from "./_components/AdminFrame";

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
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await checkUser();

  // Must be authenticated
  if (!user) {
    notFound();
  }

  // Must be Admin
  if (user.role !== "ADMIN") {
    notFound();
  }

  // The dealer dashboard's theme and frame, with the admin plate: the same
  // palette, type and width, so each admin page is built once in its final look.
  return <AdminFrame after={<SiteToaster locale={locale as Locale} position="top-right" />}>{children}</AdminFrame>;
}
