import { setRequestLocale } from "next-intl/server";
import { PageSkeleton, CarContent } from "./_components";
import { Suspense } from "react";

const CarPage = async ({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) => {
  const { id, locale } = await params;
  setRequestLocale(locale);

  return (
    <Suspense fallback={<PageSkeleton />}>
      <CarContent id={id} />
    </Suspense>
  );
};

export default CarPage;
