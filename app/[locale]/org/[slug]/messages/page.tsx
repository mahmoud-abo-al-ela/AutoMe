import { redirect } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import type { Locale } from "@/i18n/routing";
import { auth } from "@clerk/nextjs/server";
import { getOrganization } from "@/lib/getOrganization";
import { SalesDesk } from "./_components/SalesDesk";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "chat.orgInbox.meta" });

  return { title: t("title"), description: t("description") };
}

/**
 * Messages, as a sales desk (canvas: Messages round 1, 2 · Sales desk). The
 * page title lives at the top of the conversation list, so the desk can have
 * the screen's full height.
 */
export default async function OrganizationMessagesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { userId } = await auth();
  const { slug } = await params;
  const locale = await getLocale();

  if (!userId) {
    redirect({ href: "/sign-in", locale });
  }

  const { organization, membership } = await getOrganization(slug);

  if (!organization || !membership) {
    redirect({ href: "/", locale });
  }

  return <SalesDesk organizationSlug={slug} base={`/org/${slug}`} />;
}
