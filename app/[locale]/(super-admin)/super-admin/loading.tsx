import { AdminPageSkeleton } from "./_components/AdminPageSkeleton";

/**
 * An admin page on its way: a skeleton under the top bar, which belongs to the
 * layout and stays put. Pages with a skeleton of their own (the overview) set
 * it in their route group's loading.tsx.
 */
export default function SuperAdminLoading() {
  return <AdminPageSkeleton />;
}
