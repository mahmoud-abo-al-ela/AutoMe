"use client";

import { CarsPagePresenter } from "./_components/CarsPagePresenter";
import { useCarsPage } from "@/hooks/use-cars-page";

const BrowseCarsPage = () => {
  const pageData = useCarsPage();

  return <CarsPagePresenter {...pageData} />;
};

export default BrowseCarsPage;
