import React from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import CreateCarForm from "../_components/car-forms/CreateCarForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "org.carForm.meta" });

  return { title: t("title"), description: t("description") };
}

const CreateCarPage = () => {
  return (
    <div className="p-6">
      <CreateCarForm />
    </div>
  );
};

export default CreateCarPage;
