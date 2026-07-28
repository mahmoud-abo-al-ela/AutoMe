"use client";

import { CarsPagePresenter } from "./_components/CarsPagePresenter";
import { useCarsPage } from "@/hooks/use-cars-page";

const ClientPage = ({ initialData, initialState }) => {
  const pageData = useCarsPage(initialData, initialState);

  return <CarsPagePresenter {...pageData} />;
};

export default ClientPage;
