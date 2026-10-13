"use client";

import { CarsPagePresenter } from "./_components/CarsPagePresenter";
import { useCarsPage } from "@/hooks/use-cars-page";
import { useCarsWebMcpTools } from "./_components/webmcp/use-cars-webmcp-tools";

type UseCarsPageArgs = Parameters<typeof useCarsPage>;

const ClientPage = ({
  initialData,
  initialState,
}: {
  initialData: UseCarsPageArgs[0];
  initialState: UseCarsPageArgs[1];
}) => {
  const pageData = useCarsPage(initialData, initialState);
  // For a browser agent (WebMCP), where the browser offers it; nothing otherwise.
  useCarsWebMcpTools(pageData);

  return <CarsPagePresenter {...pageData} />;
};

export default ClientPage;
