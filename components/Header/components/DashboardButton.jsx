import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function DashboardButton({
  user,
  hasOrgMembership,
  isAdmin,
  className,
  buttonClassName,
  onClick,
  variant = "default",
}) {
  if (!hasOrgMembership && !isAdmin) return null;

  // Prioritize organizationSlug if it was passed 
  const orgSlug = user?.memberships?.[0]?.organization?.slug;

  const href = isAdmin ? "/super-admin" : `/org/${orgSlug}/dashboard`;

  if (!isAdmin && !orgSlug) return null;

  return (
    <div className={className}>
      <Button variant={variant} size="sm" asChild className={buttonClassName}>
        <Link href={href} onClick={onClick}>
          Dashboard
        </Link>
      </Button>
    </div>
  );
}
