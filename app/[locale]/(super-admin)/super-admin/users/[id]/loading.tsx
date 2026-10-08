import { UserTabSkeletonFromUrl } from "./_components/TabSkeletons";

/**
 * A person's page on its way, in its own shape: back link, the round initials
 * with the name, contact icons and actions, the tabs, then the open tab in
 * its own shape, read from the URL. Shimmer, like every admin skeleton.
 */
export default function UserLoading() {
  return (
    <div aria-busy className="flex flex-col gap-5">
      <span className="skeleton-shimmer h-4 w-20 rounded" />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <span className="skeleton-shimmer size-14 shrink-0 rounded-full sm:size-16" />
        <div className="flex min-w-0 flex-[1_1_200px] flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="skeleton-shimmer h-8 w-56 max-w-full rounded" />
            <span className="skeleton-shimmer h-5 w-16 rounded-full" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="skeleton-shimmer size-10 rounded-full" />
            <span className="skeleton-shimmer size-10 rounded-full" />
            <span className="skeleton-shimmer ms-1.5 h-4 w-40 rounded" />
          </div>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <span className="skeleton-shimmer h-11 flex-1 rounded-control sm:w-48 sm:flex-none" />
          <span className="skeleton-shimmer size-11 rounded-control" />
        </div>
      </div>

      <div className="flex gap-5 overflow-hidden border-b border-border pb-3">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="skeleton-shimmer h-5 w-24 shrink-0 rounded"
          />
        ))}
      </div>

      <UserTabSkeletonFromUrl />
    </div>
  );
}
