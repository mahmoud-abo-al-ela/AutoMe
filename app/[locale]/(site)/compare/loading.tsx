import ComparePageSkeleton from "@/app/[locale]/(site)/compare/_components/ComparePageSkeleton";

/** In the same frame as ComparePresenter, so nothing shifts when the page replaces it. */
export default function CompareLoading() {
  return (
    <div className="min-h-[60vh] pb-16 pt-6 sm:pt-8">
      <div className="mx-auto w-full max-w-[1360px] px-4 sm:px-6 xl:px-0">
        <ComparePageSkeleton />
      </div>
    </div>
  );
}
