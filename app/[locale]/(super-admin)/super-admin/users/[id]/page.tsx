import { notFound } from "next/navigation";
import { checkUser } from "@/lib/checkUser";
import { getUserDetail } from "@/lib/services/super-admin/user-detail";
import { parseUserDetailQuery } from "@/lib/services/super-admin/users-options";
import { UserRecord } from "./_components/UserRecord";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * One person, with the tab and page from the URL (?tab=drives&page=2). The
 * layout has already checked this is an admin.
 */
export default async function UserPage({ params, searchParams }: Props) {
  const [{ id }, query, admin] = await Promise.all([params, searchParams, checkUser()]);
  const data = await getUserDetail(id, parseUserDetailQuery(query));
  if (!data) notFound();
  return <UserRecord data={data} currentAdminId={admin!.id} />;
}
