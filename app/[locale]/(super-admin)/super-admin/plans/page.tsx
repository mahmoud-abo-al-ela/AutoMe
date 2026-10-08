import { getPlansPage } from "@/lib/services/super-admin/plans";
import { PlansView } from "./_components/PlansView";

/** Every plan, what it costs and includes, and who is on it. The layout has already checked this is an admin. */
export default async function PlansPage() {
  return <PlansView data={await getPlansPage()} />;
}
