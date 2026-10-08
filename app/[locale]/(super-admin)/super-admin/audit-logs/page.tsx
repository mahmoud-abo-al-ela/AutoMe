import { getPlatformActivity } from "@/lib/services/super-admin/platform-activity";
import { parsePlatformActivityQuery } from "@/lib/services/super-admin/platform-activity-options";
import { ActivityLog } from "./_components/ActivityLog";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/**
 * Every change across AutoMe. The search, filters and page come from the
 * URL; the layout has already checked this is an admin.
 */
export default async function ActivityPage({ searchParams }: Props) {
  const data = await getPlatformActivity(parsePlatformActivityQuery(await searchParams));
  return <ActivityLog data={data} />;
}
