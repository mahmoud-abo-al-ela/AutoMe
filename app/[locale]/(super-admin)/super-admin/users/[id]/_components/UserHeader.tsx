"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  ChevronLeft,
  Mail,
  MoreHorizontal,
  Phone,
  ShieldCheck,
  ShieldOff,
  UserCog,
} from "lucide-react";
import { toast } from "sonner";
import { Link, useRouter } from "@/i18n/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useActionError } from "@/hooks/use-action-error";
import { useFormatters } from "@/hooks/use-formatters";
import { cn } from "@/lib/utils";
import { updateUserRole } from "@/actions/super-admin";
import type { UserDetail } from "@/lib/services/super-admin/user-detail";
import ImpersonateModal from "../../../organizations/_components/ImpersonateModal";
import { KIND_TONES, type UserKind } from "../../_components/use-user-display";

/**
 * The top of a person's page: back to the list, who they are and what kind of
 * account they have, and their actions behind "⋯" — a support session as them
 * when they are on a dealership's team, and giving or taking platform admin
 * access, which asks first. Your own access can't be taken from here.
 */
export function UserHeader({
  data,
  currentAdminId,
}: {
  data: UserDetail;
  currentAdminId: string;
}) {
  const t = useTranslations("superAdmin.users");
  const tCommon = useTranslations("superAdmin.common");
  const actionError = useActionError();
  const fmt = useFormatters();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [changing, setChanging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [impersonating, setImpersonating] = useState(false);
  const { user } = data;
  const name = user.name || user.email || user.phone || t("noName");
  const kind: UserKind =
    user.role === "ADMIN"
      ? "admin"
      : user.memberships[0]?.role === "OWNER"
        ? "owner"
        : user.memberships[0]
          ? "member"
          : "buyer";
  const team = user.memberships[0]?.organization;
  const makingAdmin = user.role !== "ADMIN";
  const self = user.id === currentAdminId;
  const initials = name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
  // A phone as stored can carry an extension ("x660"); the call link takes the number before it.
  const dial = user.phone?.split(/x|ext/i)[0].replace(/[^\d+]/g, "");
  const contacts = [
    user.email && {
      key: "email",
      href: `mailto:${user.email}`,
      label: t("details.emailLabel", { email: user.email }),
      value: user.email,
      Icon: Mail,
    },
    user.phone &&
      dial && {
        key: "phone",
        href: `tel:${dial}`,
        label: t("details.callLabel", { phone: user.phone }),
        value: user.phone,
        Icon: Phone,
      },
  ].filter(
    (
      contact,
    ): contact is Exclude<typeof contact, null | undefined | "" | false> =>
      Boolean(contact),
  );

  const changeRole = async () => {
    setSaving(true);
    try {
      const result = await updateUserRole(
        user.id,
        makingAdmin ? "ADMIN" : "USER",
      );
      if (result.success) {
        toast.success(
          t(makingAdmin ? "roleDialog.made" : "roleDialog.removed", { name }),
        );
        startTransition(() => router.refresh());
      } else {
        toast.error(t("roleDialog.failed"), {
          description: actionError(result.error, tCommon("errorBody")),
        });
      }
    } catch {
      toast.error(tCommon("errorTitle"), { description: tCommon("errorBody") });
    } finally {
      setSaving(false);
      setChanging(false);
    }
  };

  return (
    <header className="flex flex-col gap-4">
      <Link
        href="/super-admin/users"
        className="flex w-fit items-center gap-1.5 rounded-control text-caption text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ChevronLeft aria-hidden className="size-4 rtl:-scale-x-100" />
        {t("details.back")}
      </Link>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <span
          aria-hidden
          dir="auto"
          className={cn(
            "flex size-14 shrink-0 items-center justify-center rounded-full text-[1.15rem] font-extrabold sm:size-16",
            user.role === "ADMIN"
              ? "bg-inverse text-inverse-foreground"
              : "bg-[#e7eef8] text-[#1d4e9e]",
          )}
        >
          {initials}
        </span>
        <div className="min-w-0 flex-[1_1_200px]">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="text-h1 font-extrabold">
              <bdi>{name}</bdi>
            </h1>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-micro font-bold",
                KIND_TONES[kind],
              )}
            >
              {t(`kinds.${kind}`)}
            </span>
          </div>
          {/* How to reach them as icons — the address or number shows on hover and is read out — then when they joined. */}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-2 text-body text-muted-foreground">
            {contacts.length > 0 && (
              <ul className="flex items-center gap-1.5">
                {contacts.map(({ key, href, label, value, Icon }) => (
                  <li key={key}>
                    <a
                      href={href}
                      aria-label={label}
                      title={value}
                      className="flex size-10 items-center justify-center rounded-full border border-border bg-field text-foreground transition-colors hover:border-[#1d4e9e] hover:text-[#1d4e9e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Icon aria-hidden className="size-[18px]" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
            <span>
              {t("details.joined", {
                date: fmt.date(user.createdAt, { month: "long" }),
              })}
            </span>
          </div>
        </div>
        {/* Every action behind "⋯": a support session when they are on a team, and admin access unless it's you. */}
        {(team || !self) && (
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label={t("details.more")}
              className="flex size-11 shrink-0 items-center justify-center rounded-control border-2 border-border-strong bg-field hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <MoreHorizontal aria-hidden className="size-[18px]" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-control p-1.5">
              {team && (
                <DropdownMenuItem className="h-10 gap-2.5" onSelect={() => setImpersonating(true)}>
                  <UserCog aria-hidden className="size-4" />
                  {t("actions.impersonate")}
                </DropdownMenuItem>
              )}
              {team && !self && <DropdownMenuSeparator />}
              {!self && (
                <DropdownMenuItem
                  className={cn("h-10 gap-2.5", !makingAdmin && "text-destructive focus:text-destructive")}
                  onSelect={() => setChanging(true)}
                >
                  {makingAdmin ? <ShieldCheck aria-hidden className="size-4" /> : <ShieldOff aria-hidden className="size-4" />}
                  {makingAdmin ? t("actions.makeAdmin") : t("actions.removeAdmin")}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {impersonating && team && (
        <ImpersonateModal
          organization={team}
          userId={user.id}
          onClose={() => setImpersonating(false)}
        />
      )}
      <AlertDialog
        open={changing}
        onOpenChange={(open) => !open && !saving && setChanging(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t(
                makingAdmin ? "roleDialog.makeTitle" : "roleDialog.removeTitle",
                { name },
              )}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(makingAdmin ? "roleDialog.makeBody" : "roleDialog.removeBody")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer" disabled={saving}>
              {t("roleDialog.keep")}
            </AlertDialogCancel>
            <AlertDialogAction
              className={cn(
                "cursor-pointer",
                !makingAdmin &&
                  "bg-destructive text-white hover:bg-destructive/90",
              )}
              disabled={saving}
              onClick={(event) => {
                event.preventDefault();
                changeRole();
              }}
            >
              {saving
                ? t("roleDialog.saving")
                : t(
                    makingAdmin
                      ? "roleDialog.makeConfirm"
                      : "roleDialog.removeConfirm",
                  )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
}
