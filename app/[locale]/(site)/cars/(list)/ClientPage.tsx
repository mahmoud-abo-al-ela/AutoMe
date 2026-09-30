"use client";

import { CarsPagePresenter } from "./_components/CarsPagePresenter";
import { useCarsPage } from "@/hooks/use-cars-page";

type UseCarsPageArgs = Parameters<typeof useCarsPage>;

const ClientPage = ({
  initialData,
  initialState,
}: {
  initialData: UseCarsPageArgs[0];
  initialState: UseCarsPageArgs[1];
}) => {
  const pageData = useCarsPage(initialData, initialState);

  return <CarsPagePresenter {...pageData} />;
};

export default ClientPage;
