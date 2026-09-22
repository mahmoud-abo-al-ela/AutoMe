import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

/** Only the slug is read here; the rest of the Clerk/Prisma user is irrelevant. */
type UserWithMemberships = {
  memberships?: { organization?: { slug?: string | null } | null }[] | null;
} | null;

export default function DashboardButton({
  user,
  hasOrgMembership,
  isAdmin,
  className,
  buttonClassName,
  onClick,
  variant = "default",
}: {
  user?: UserWithMemberships;
  hasOrgMembership?: boolean;
  isAdmin?: boolean;
  className?: string;
  buttonClassName?: string;
  onClick?: () => void;
  variant?: React.ComponentProps<typeof Button>["variant"];
}) {
  const t = useTranslations("nav");
  if (!hasOrgMembership && !isAdmin) return null;

  // Prioritize organizationSlug if it was passed 
  const orgSlug = user?.memberships?.[0]?.organization?.slug;

  const href = isAdmin ? "/super-admin" : `/org/${orgSlug}/dashboard`;

  if (!isAdmin && !orgSlug) return null;

  return (
    <div className={className}>
      <Button variant={variant} size="sm" asChild className={buttonClassName}>
        <Link href={href} onClick={onClick}>
          {t("dashboard")}
        </Link>
      </Button>
    </div>
  );
}
