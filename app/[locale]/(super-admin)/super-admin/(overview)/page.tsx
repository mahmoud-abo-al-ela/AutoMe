import { checkUser } from "@/lib/checkUser";
import { getPlatformOverview } from "@/lib/services/super-admin/overview";
import { parseOverviewPeriod } from "@/lib/services/super-admin/overview-options";
import { PlatformOverview } from "../_components/PlatformOverview";

type Props = { searchParams: Promise<{ days?: string; compare?: string }> };

/**
 * The super-admin home: the platform's numbers for a period. The period and
 * whether it is compared with the one before live in the URL. The layout has
 * already checked this is an admin.
 */
export default async function SuperAdminHome({ searchParams }: Props) {
  const query = await searchParams;
  const days = parseOverviewPeriod(query.days);
  const [user, data] = await Promise.all([checkUser(), getPlatformOverview(days)]);
  return <PlatformOverview data={data} compare={query.compare !== "none"} currentAdminId={user!.id} />;
}
