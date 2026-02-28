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

export const metadata = {
  title: "AutoMe",
  description: "Find your dream car",
};

export default async function SiteLayout({ children }) {
  let user = null;
  let organization = null;

  try {
    user = await checkUser();
    organization = await getCurrentOrganization();
  } catch (error) {
    console.error("Error in layout when checking user:", error);
  }

  return (
    <div className="flex flex-col min-h-screen">
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
      <Footer user={user} />
      <BackToTop />
      <Toaster position="top-right" richColors />
    </div>
  );
}
