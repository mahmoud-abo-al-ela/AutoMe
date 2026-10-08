import { getDealerships } from "@/lib/services/super-admin/dealerships";
import { parseDealershipQuery } from "@/lib/services/super-admin/dealerships-options";
import { DealershipsList } from "../_components/DealershipsList";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/**
 * Every dealership on the platform. The view, search, filters, sort and page
 * all come from the URL; the layout has already checked this is an admin.
 */
export default async function DealershipsPage({ searchParams }: Props) {
  const data = await getDealerships(parseDealershipQuery(await searchParams));
  return <DealershipsList data={data} />;
}
