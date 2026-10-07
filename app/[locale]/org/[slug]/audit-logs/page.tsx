import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { checkUser } from "@/lib/checkUser";
import { getOrganizationBySlug, getUserMembership } from "@/lib/getOrganization";
import { planKeyFor } from "@/components/Pricing/pricing-plans";
import { formatNumber } from "@/lib/utils/number";
import { ACTIVITY_DAYS, ACTIVITY_KINDS, getActivity, type ActivityKind } from "@/lib/services/audit/activity";
import { ActivityFeed } from "./_components/ActivityFeed";

type SearchParams = Record<string, string | string[] | undefined>;

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "org.auditLogs.meta" });
  return { title: t("title"), description: t("description") };
}

/** Repeated query keys arrive as arrays; the filters only ever set one value. */
function readParam(params: SearchParams, key: string): string {
  const value = params?.[key];
  return (Array.isArray(value) ? value[0] : value) || "";
}

/**
 * The dealership's Activity (owners only): who changed what, as a feed. Kind,
 * person, period and page are all in the address — ?kind=cars&who=…&days=7.
 */
export default async function ActivityPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; locale: Locale }>;
  searchParams: Promise<SearchParams>;
}) {
  const { slug, locale } = await params;
  const search = await searchParams;
  const user = await checkUser();
  const organization = await getOrganizationBySlug(slug);
  if (!organization) notFound();

  // The org layout redirects to /sign-in when there is no user, so this page
  // is only reachable with one.
  const membership = await getUserMembership(user!.id, organization.id);
  if (membership?.role !== "OWNER") notFound();

  const requestedKind = readParam(search, "kind");
  const kind: ActivityKind = (ACTIVITY_KINDS as readonly string[]).includes(requestedKind) ? (requestedKind as ActivityKind) : "all";
  const requestedDays = readParam(search, "days") || "30";
  const days = requestedDays === "all" || (ACTIVITY_DAYS as readonly number[]).includes(Number(requestedDays)) ? requestedDays : "30";
  const page = Math.max(1, Math.min(1000, parseInt(readParam(search, "page"), 10) || 1));
  const who = readParam(search, "who");

  const activity = await getActivity({
    organizationId: organization.id,
    kind,
    // Entries are scoped to this dealership, so an id from anywhere else matches nothing.
    userId: who || undefined,
    days: days === "all" ? undefined : Number(days),
    page,
  });
  const whoKnown = activity.people.some((person) => person.id === who) ? who : "";

  const t = await getTranslations("org.auditLogs");
  const tPlans = await getTranslations("plans");
  const plan = organization.subscription?.plan;
  const planKey = planKeyFor(plan?.type);
  const planName = planKey ? tPlans(`plans.${planKey}.name`) : (plan?.name ?? tPlans("plans.starter.name"));
  const retentionDays = plan?.auditLogRetentionDays;
  const retention = retentionDays
    ? t("retention", { count: retentionDays, value: formatNumber(retentionDays, locale), plan: planName })
    : t("retentionUnlimited", { plan: planName });

  return (
    <ActivityFeed
      activity={activity}
      filters={{ kind, who: whoKnown, days, page }}
      base={`/org/${slug}/audit-logs`}
      dealershipName={organization.name}
      retention={retention}
    />
  );
}
