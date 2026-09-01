import { setRequestLocale } from "next-intl/server";
import Footer from "@/components/Footer";
import MainHeader from "@/components/Header/MainHeader";
import React from "react";

const layout = async ({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) => {
  // The footer and header live in this layout, so the locale has to be set
  // here as well as in the pages — a page-level call happens too late for
  // the layout that wraps it.
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex flex-col min-h-screen">
      <MainHeader />
      <main className="flex justify-center py-30 flex-1">{children}</main>
      <Footer />
    </div>
  );
};

export default layout;
