import { DealershipsPageSkeleton } from "../_components/DealershipsPageSkeleton";

/**
 * The list's own skeleton. In the (list) group so it does not also wrap a
 * dealership's page, as it did when it sat in dealerships/ — opening a
 * dealership showed the list's skeleton first, then the page's.
 */
export default function DealershipsLoading() {
  return <DealershipsPageSkeleton />;
}
