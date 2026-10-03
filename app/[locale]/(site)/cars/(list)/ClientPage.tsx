"use client";

import { CarsPagePresenter } from "./_components/CarsPagePresenter";
import { useCarsPage } from "@/hooks/use-cars-page";
import type { MarketSummary } from "@/components/brand";

type UseCarsPageArgs = Parameters<typeof useCarsPage>;

const ClientPage = ({
  initialData,
  initialState,
  summary,
}: {
  initialData: UseCarsPageArgs[0];
  initialState: UseCarsPageArgs[1];
  /** The market readout; read once on the server, it does not follow the filters. */
  summary?: MarketSummary | null;
}) => {
  const pageData = useCarsPage(initialData, initialState);

  return <CarsPagePresenter {...pageData} summary={summary} />;
};

export default ClientPage;
