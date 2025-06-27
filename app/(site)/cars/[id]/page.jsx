import { PageSkeleton, CarContent } from "./_components";
import { Suspense } from "react";

const CarPage = async ({ params }) => {
  const id = params.id;

  return (
    <Suspense fallback={<PageSkeleton />}>
      <CarContent id={id} />
    </Suspense>
  );
};

export default CarPage;
