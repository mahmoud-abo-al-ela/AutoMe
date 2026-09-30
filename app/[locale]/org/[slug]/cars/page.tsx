import React from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import CarsList from "./_components/car-list/CarsList";
import { CarsPlanBanner } from "./_components/cars-plan-banner";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "org.cars.meta" });

  return { title: t("title"), description: t("description") };
}

const CarsPage = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  const t = await getTranslations("org.cars");

  return (
    <div>
      <CarsPlanBanner orgSlug={slug} />
      <div className="mb-6 md:mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
              {t("title")}
            </h1>
            <p className="text-gray-600 text-sm md:text-base">
              {t("subtitle")}
            </p>
          </div>
        </div>
      </div>
      <CarsList />
    </div>
  );
};

export default CarsPage;
