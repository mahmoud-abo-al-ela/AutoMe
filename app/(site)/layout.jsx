import { Inter } from "next/font/google";
import MainHeader from "@/components/Header/MainHeader";
import Footer from "@/components/Footer";
import { checkUser } from "@/lib/checkUser";
import { getCurrentOrganization } from "@/lib/getOrganization";
import BackToTop from "@/components/BackToTop";
import { Toaster } from "sonner";
import { Suspense } from "react";
import Loading from "@/components/Loading";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata() {
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

export default async function SiteLayout({ children }) {
  const user = await checkUser();
  const organization = await getCurrentOrganization();
  const primaryColor = organization?.theme?.primaryColor;
  const secondaryColor = organization?.theme?.secondaryColor;

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
        className={`flex-1 animate-in fade-in duration-500 ${inter.className}`}
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
