import { getAnalytics } from "@/lib/services/super-admin/analytics";
import { parseAnalyticsQuery } from "@/lib/services/super-admin/analytics-options";
import { AnalyticsView } from "./_components/AnalyticsView";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/**
 * The marketplace in numbers. The report and period come from the URL; the
 * layout has already checked this is an admin.
 */
export default async function AnalyticsPage({ searchParams }: Props) {
  const analytics = await getAnalytics(parseAnalyticsQuery(await searchParams));
  return <AnalyticsView analytics={analytics} />;
}
