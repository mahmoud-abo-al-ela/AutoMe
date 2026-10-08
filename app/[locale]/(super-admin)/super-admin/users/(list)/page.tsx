import { checkUser } from "@/lib/checkUser";
import { getUsers } from "@/lib/services/super-admin/users";
import { parseUserQuery } from "@/lib/services/super-admin/users-options";
import { UsersList } from "../_components/UsersList";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/**
 * Everyone with an AutoMe account. The view, search, dealership, sort and
 * page come from the URL; the layout has already checked this is an admin.
 */
export default async function UsersPage({ searchParams }: Props) {
  const [user, data] = await Promise.all([checkUser(), searchParams.then((params) => getUsers(parseUserQuery(params)))]);
  return <UsersList data={data} currentAdminId={user!.id} />;
}
