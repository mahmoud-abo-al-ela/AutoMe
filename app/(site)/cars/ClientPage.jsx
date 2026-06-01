"use client";

import { CarsPagePresenter } from "./_components/CarsPagePresenter";
import { useCarsPage } from "@/hooks/use-cars-page";

const ClientPage = ({ initialData }) => {
  const pageData = useCarsPage(initialData);

  return <CarsPagePresenter {...pageData} />;
};

export default ClientPage;
