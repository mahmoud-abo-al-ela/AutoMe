import { notFound } from "next/navigation";
import { getDealershipDetail } from "@/lib/services/super-admin/dealership-detail";
import { parseDealershipDetailQuery } from "@/lib/services/super-admin/dealerships-options";
import { DealershipRecord } from "./_components/DealershipRecord";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * One dealership, with the tab and its filters from the URL (?tab=cars&status=SOLD). The
 * layout has already checked this is an admin.
 */
export default async function DealershipPage({ params, searchParams }: Props) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const data = await getDealershipDetail(id, parseDealershipDetailQuery(query));
  if (!data) notFound();
  return <DealershipRecord data={data} />;
}
