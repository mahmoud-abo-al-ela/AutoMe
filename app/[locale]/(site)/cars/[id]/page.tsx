import { PageSkeleton, CarContent } from "./_components";
import { Suspense } from "react";

const CarPage = async ({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) => {
  const { id, locale } = await params;

  return (
    <Suspense fallback={<PageSkeleton />}>
      <CarContent id={id} />
    </Suspense>
  );
};

export default CarPage;
