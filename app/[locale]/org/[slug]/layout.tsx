/**
 * Set here rather than on the AI car-form page because that page is a client
 * component, and route segment config is only read from Server Components.
 * This is the nearest server ancestor. See the matching note on the public home
 * page — the dealer photo extraction has the same 10s-default problem.
 *
 * A ceiling, not a reservation: fast requests are unaffected.
 */
export const maxDuration = 60;

import { checkUser } from "@/lib/checkUser";
import { getOrganizationBySlug, getUserMembership } from "@/lib/getOrganization";
import { getCurrentImpersonationSession } from "@/lib/services/impersonation/impersonation";
import BackToTop from "@/components/BackToTop";
import { Suspense } from "react";
import { RoadLoader } from "@/components/brand";
import { alexandria } from "@/components/brand/site-font";
import { SiteToaster } from "@/components/brand/SiteToaster";
import { notFound } from "next/navigation";
import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getLocale, getTranslations } from "next-intl/server";
import { OrgTopBar } from "./_components/OrgTopBar";
import ImpersonationBanner from "./_components/ImpersonationBanner";

// The route params as Next generates them for the layout validator: it
// requires a plain string, so the narrowed Locale is used only where this
// code passes it on to next-intl.
type OrgParams = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: Locale; slug: string }>;
}) {
    const { locale, slug } = await params;
    const t = await getTranslations({ locale, namespace: "org.meta" });
    const organization = await getOrganizationBySlug(slug);

    if (!organization) {
        return {
            title: t("notFoundTitle"),
        };
    }

    return {
        title: `${organization.name}`,
        description: t("description", { name: organization.name }),
    };
}

export default async function OrganizationLayout({
    children,
    params,
}: OrgParams & { children: React.ReactNode }) {
    const { slug } = await params;
    const user = await checkUser();
    const locale = (await getLocale()) as Locale;

    if (!user) {
        redirect({ href: "/sign-in", locale });
    }

    // Get organization from path parameter
    const organization = await getOrganizationBySlug(slug);

    if (!organization) {
        notFound();
    }

    // Check if user is impersonating
    const impersonationSession = await getCurrentImpersonationSession();
    const isImpersonating = !!impersonationSession;

    // Get user's membership in this organization
    const membership = await getUserMembership(user.id, organization.id);
    const isAdmin = user.role === "ADMIN";
    const hasOrgAccess = !!membership;

    if (!isAdmin && !isImpersonating && !hasOrgAccess) {
        notFound();
    }

    // The public site's theme (palette, Alexandria), with the dashboard's own
    // chart colours (globals.css: data-surface="work"). The navigation is one
    // bar across the top (OrgTopBar), so the work area keeps the full width.
    return (
        <div
            data-theme="site"
            data-surface="work"
            className={`${alexandria.variable} flex min-h-screen flex-col bg-background text-foreground`}
        >
            <OrgTopBar organization={organization} userRole={membership?.role} />
            {isImpersonating && impersonationSession && (
                <ImpersonationBanner
                    session={impersonationSession}
                    organization={organization}
                />
            )}
            <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-4 pb-16 pt-6 sm:px-6 md:px-8 md:pt-10">
                <Suspense fallback={<RoadLoader />}>{children}</Suspense>
            </main>
            <SiteToaster locale={locale} position="top-right" />
            <BackToTop />
        </div>
    );
}

