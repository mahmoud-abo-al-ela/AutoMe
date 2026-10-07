import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Locale } from "@/i18n/routing";
import { getOrganizationBySlug } from "@/lib/getOrganization";
import { RequestsView } from "./_components/RequestsPresenter";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "org.requests.meta" });
  return { title: t("title"), description: t("description") };
}

/**
 * Requests: what buyers are waiting on the dealer for (test drives to
 * confirm, questions to answer), acted on in place. The org layout has
 * already checked access; this resolves the organization for the live
 * unread-chat count, and the rest is client-side on the shared actions.
 */
export default async function RequestsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const organization = await getOrganizationBySlug(slug);
  if (!organization) notFound();
  return <RequestsView organizationId={organization.id} />;
}
