import type { Metadata } from "next";
import MainHeader from "@/components/Header/MainHeader";
import Footer from "@/components/Footer";
import { checkUser } from "@/lib/checkUser";
import { getCurrentOrganization } from "@/lib/getOrganization";
import BackToTop from "@/components/BackToTop";
import { Toaster } from "sonner";
import { Suspense } from "react";
import Loading from "@/components/Loading";


export async function generateMetadata(): Promise<Metadata> {
  const organization = await getCurrentOrganization();
  if (organization) {
    return {
      title: {
        template: `%s | ${organization.name}`,
        default: organization.name,
      },
      description: organization.description || `Welcome to ${organization.name}`,
      icons: {
        icon: organization.logo || "/favicon.ico",
      },
    };
  }

  return {
    title: {
      template: "%s | AutoMe",
      default: "AutoMe",
    },
    description: "Find your dream car",
  };
}

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

  return (
    <div className="flex flex-col min-h-screen">
      {primaryColor && (
        <style dangerouslySetInnerHTML={{
          __html: `
            :root {
              --primary: ${primaryColor};
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
        <Suspense
          fallback={
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <Loading />
            </div>
          }
        >
          {children}
        </Suspense>
      </main>
      <Footer user={user} organization={organization} />
      <BackToTop />
      <Toaster position="top-right" richColors />
    </div>
  );
}
