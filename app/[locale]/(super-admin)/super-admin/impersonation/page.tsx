import { checkUser } from "@/lib/checkUser";
import { getSessions } from "@/lib/services/super-admin/sessions";
import { parseSessionQuery } from "@/lib/services/super-admin/sessions-options";
import { SessionsList } from "./_components/SessionsList";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/**
 * Every support session. The view, search, admin, period and page come from
 * the URL; the layout has already checked this is an admin.
 */
export default async function SupportSessionsPage({ searchParams }: Props) {
  const [admin, params] = await Promise.all([checkUser(), searchParams]);
  const data = await getSessions(parseSessionQuery(params), admin!.id);
  return <SessionsList data={data} currentAdminId={admin!.id} />;
}
