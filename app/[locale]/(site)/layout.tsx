import { getLocale } from "next-intl/server";
import MainHeader from "@/components/Header/MainHeader";
import BottomTabBar from "@/components/Header/BottomTabBar";
import Footer from "@/components/Footer";
import { checkUser } from "@/lib/checkUser";
import { getCurrentOrganization } from "@/lib/getOrganization";
import BackToTop from "@/components/BackToTop";
import { Suspense } from "react";
import { DealerPitchProvider, RoadLoader, SiteBrandProvider } from "@/components/brand";
import { alexandria } from "@/components/brand/site-font";
import { SiteToaster } from "@/components/brand/SiteToaster";
import { showsDealerPitch } from "@/lib/org/client";
import type { Locale } from "@/i18n/routing";
import { BuyerViewerProvider } from "@/components/BuyerAccess";
import { toBuyerViewer } from "@/lib/auth/buyer-policy";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await checkUser();
  const organization = await getCurrentOrganization();
  // `theme` is a Json column, so it can be any JSON value; only a plain object
  // carries the colours, and only strings are safe to interpolate into CSS.
  const theme =
    organization?.theme &&
    typeof organization.theme === "object" &&
    !Array.isArray(organization.theme)
      ? (organization.theme as Record<string, unknown>)
      : null;
  const primaryColor =
    typeof theme?.primaryColor === "string" ? theme.primaryColor : null;
  const secondaryColor =
    typeof theme?.secondaryColor === "string" ? theme.secondaryColor : null;
  const locale = (await getLocale()) as Locale;

  return (
    // data-theme="site" switches the root palette to the public-site theme
    // (see globals.css); the override below must use the same selector, or
    // the theme block — more specific than a bare :root — would win over it.
    <SiteBrandProvider name={organization?.name}>
      <DealerPitchProvider show={showsDealerPitch(user, !!organization)}>
        {/* Which buyer buttons this viewer gets (lib/auth/buyer-policy). */}
        <BuyerViewerProvider viewer={toBuyerViewer(user)} onSubdomain={!!organization}>
        <div data-theme="site" className={`${alexandria.variable} flex flex-col min-h-screen`}>
          {primaryColor && (
            <style dangerouslySetInnerHTML={{
              __html: `
                :root:has([data-theme="site"]) {
                  --primary: ${primaryColor};
                  --primary-hover: color-mix(in oklab, ${primaryColor} 82%, black);
                  --primary-soft: color-mix(in oklab, ${primaryColor} 10%, white);
                  --ring: ${primaryColor};
                  ${secondaryColor ? `--secondary: ${secondaryColor};` : ""}
                }
              `
            }} />
          )}
          <MainHeader user={user} organizationSlug={organization?.slug} organization={organization} />
          <main
            // No font class here. This used to carry a SECOND Inter instance,
            // which set font-family: Inter, Inter Fallback on every page body —
            // and Inter Fallback is local(Arial), which covers Arabic. So all
            // page content rendered Arabic in Arial while the header and footer,
            // which sit outside <main>, correctly inherited the Cairo stack from
            // <body>. Inheriting is the whole point; see globals.css.
            className="flex-1 animate-in fade-in duration-500"
          >
            {/* The content area waits; the header and tab bar stay usable. */}
            <Suspense fallback={<RoadLoader />}>
              {children}
            </Suspense>
          </main>
          <Footer user={user} organization={organization} />
          <BottomTabBar user={user} organizationSlug={organization?.slug} organization={organization} />
          <BackToTop />
          {/* Phones: above the bottom tab bar (84px incl. safe area). */}
          <SiteToaster locale={locale} mobileOffset={{ bottom: 96 }} />
        </div>
        </BuyerViewerProvider>
      </DealerPitchProvider>
    </SiteBrandProvider>
  );
}
