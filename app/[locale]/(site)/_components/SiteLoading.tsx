import { RoadLoader } from "@/components/brand";

/**
 * The route-level loading state for public pages with no skeleton of their
 * own (home, About, FAQ, contact, legal, test drive); each one's loading.tsx
 * re-exports it. Pages with a known layout (Browse, a car, dealerships,
 * compare, wishlist, messages) keep their skeletons. The plate's name comes
 * from SiteBrandProvider in the (site) layout, which wraps these boundaries.
 *
 * Deliberately not a single (site)/loading.tsx: Next prefetches dynamic
 * routes only down to the first loading boundary, so one at the group level
 * would show this loader before those pages' skeletons on every visit.
 */
export default function SiteLoading() {
  return <RoadLoader />;
}
