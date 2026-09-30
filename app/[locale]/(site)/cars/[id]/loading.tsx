import { PageSkeleton } from "./_components";

/**
 * Shown the moment a car is opened. The car list's own loading screen used to
 * wrap this route too — it sat above it in cars/ — so opening a car showed
 * the list's skeleton first, then this one. The list now lives in the (list)
 * route group, and a car page shows only its own.
 */
export default function CarLoading() {
  return <PageSkeleton />;
}
