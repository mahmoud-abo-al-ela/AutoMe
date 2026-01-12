"use client";

import { CarsListPresenter } from "./CarsListPresenter";
import { useAdminCarsList } from "@/hooks/use-admin-cars-list";

const CarsList = () => {
  const pageData = useAdminCarsList();

  return <CarsListPresenter {...pageData} />;
};

export default CarsList;
