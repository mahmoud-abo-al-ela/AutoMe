import { Inter } from "next/font/google";
import MainHeader from "@/components/Header/MainHeader";
import Footer from "@/components/Footer";
import { checkUser } from "@/lib/checkUser";
import BackToTop from "@/components/BackToTop";
import { Toaster } from "sonner";
const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "AutoMe",
  description: "Find your dream car",
};

export default async function SiteLayout({ children }) {
  let user = null;
  try {
    user = await checkUser();
    console.log(user);
  } catch (error) {
    console.error("Error in layout when checking user:", error);
  }

  return (
    <>
      <MainHeader user={user} />
      <main
        className={`flex-1 animate-in fade-in duration-500 ${inter.className}`}
      >
        {children}
      </main>
      <Footer />
      <BackToTop />
      <Toaster position="top-right" richColors />
    </>
  );
}
