import { PageSkeleton, CarContent } from "./_components";
import { Suspense } from "react";

const CarPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const id = (await params).id;

  return (
    <Suspense fallback={<PageSkeleton />}>
      <CarContent id={id} />
    </Suspense>
  );
};

export default CarPage;
