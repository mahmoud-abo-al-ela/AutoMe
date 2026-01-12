"use client";

import { ReservationPresenter } from "./_components/ReservationPresenter";
import { useReservationPage } from "@/hooks/use-reservation-page";

const ReservationPage = () => {
  const pageData = useReservationPage();

  return <ReservationPresenter {...pageData} />;
};

export default ReservationPage;
