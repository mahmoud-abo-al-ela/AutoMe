import React from "react";
import FeaturedCard from "./FeaturedCard";
import { getTranslations } from "next-intl/server";

const Featured = async () => {
  const t = await getTranslations("home.featured");
  return <FeaturedCard title={t("title")} subtitle={t("subtitle")} />;
};

export default Featured;
