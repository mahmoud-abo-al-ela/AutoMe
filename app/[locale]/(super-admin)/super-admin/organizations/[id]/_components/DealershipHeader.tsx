"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronLeft, ExternalLink, MoreHorizontal, Trash2, UserCog } from "lucide-react";
import { toast } from "sonner";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";
import { storefrontUrl } from "@/lib/utils/tenant-host";
import { deleteOrganization, updateOrganizationStatus } from "@/actions/super-admin";
import type { DealershipDetail } from "@/lib/services/super-admin/dealership-detail";
import DeleteOrganizationDialog from "../../_components/DeleteOrganizationDialog";
import ImpersonateModal from "../../_components/ImpersonateModal";
import { STATUS_TONES, useDealershipDisplay } from "../../_components/use-dealership-display";

/**
 * The top of a dealership's page: back to the list, who it is and where it
 * stands, and its actions — suspend or reactivate (suspending asks first),
 * and behind "⋯" a support session, the storefront and delete.
 */
export function DealershipHeader({ data }: { data: DealershipDetail }) {
  const t = useTranslations("superAdmin.organizations");
  const tCommon = useTranslations("superAdmin.common");
  const actionError = useActionError();
  const display = useDealershipDisplay();
  const locale = useLocale();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [impersonating, setImpersonating] = useState(false);
  const [confirmSuspend, setConfirmSuspend] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { dealership: org, subscription: sub, counts } = data;

  const standing = display.status({
    isActive: org.isActive,
    subscription: sub ? { status: sub.status, pastDueSince: sub.pastDueSince, periodEnd: sub.periodEnd } : null,
  });
  const place = display.place(org);
  const line = [
    place,
    t("details.planLine", { plan: display.plan({ plan: sub?.plan ?? null }) }),
    t("details.joined", { date: display.day(org.createdAt) }),
  ]
    .filter(Boolean)
    .join(locale === "ar" ? "، " : ". ");
  const letters = org.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  const setStatus = async (isActive: boolean) => {
    setBusy(true);
    try {
      const result = await updateOrganizationStatus(org.id, isActive);
      if (result.success) {
        toast.success(isActive ? t("toasts.activated") : t("toasts.suspended"), {
          description: isActive ? t("toasts.activatedBody", { name: org.name }) : t("toasts.suspendedBody", { name: org.name }),
        });
        startTransition(() => router.refresh());
      } else {
        toast.error(t("toasts.statusFailed"), { description: actionError(result.error, tCommon("errorBody")) });
      }
    } catch {
      toast.error(tCommon("errorTitle"), { description: tCommon("errorBody") });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      const result = await deleteOrganization(org.id);
      if (result.success) {
        toast.success(t("toasts.deleted"), { description: t("toasts.deletedBody", { name: org.name }) });
        router.push("/super-admin/organizations");
      } else {
        toast.error(t("toasts.deleteFailed"), { description: actionError(result.error, tCommon("errorBody")) });
      }
    } catch {
      toast.error(tCommon("errorTitle"), { description: tCommon("errorBody") });
    } finally {
      setBusy(false);
      setDeleting(false);
    }
  };

  return (
    <header className="flex flex-col gap-4">
      <Link
        href="/super-admin/organizations"
        className="flex w-fit items-center gap-1.5 rounded-control text-caption text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ChevronLeft aria-hidden className="size-4 rtl:-scale-x-100" />
        {t("details.back")}
      </Link>

      {/* Phones: the plate and name side by side, the actions in one row beneath. */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <span
          aria-hidden
          dir="auto"
          className={cn(
            "flex size-14 shrink-0 items-center justify-center rounded-[16px] text-[1.25rem] font-extrabold sm:size-16",
            org.isActive ? "bg-[#e7eef8] text-[#1d4e9e]" : "bg-muted text-muted-foreground",
          )}
        >
          {letters}
        </span>
        <div className="min-w-0 flex-[1_1_200px]">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="text-h1 font-extrabold">
              <bdi>{org.name}</bdi>
            </h1>
            <span className={cn("rounded-full px-2.5 py-0.5 text-micro font-bold", STATUS_TONES[standing.tone])}>{standing.label}</span>
          </div>
          <p className="mt-1 text-body text-muted-foreground">{line}</p>
        </div>
        <div className="grid w-full grid-cols-[1fr_auto] gap-2 sm:flex sm:w-auto">
          <Button
            variant="outline-strong"
            size="control"
            className="h-11 min-w-0 bg-field px-3 sm:px-4"
            disabled={busy}
            onClick={() => (org.isActive ? setConfirmSuspend(true) : setStatus(true))}
          >
            {org.isActive ? t("actions.suspend") : t("actions.activate")}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label={t("details.more")}
              className="flex size-11 items-center justify-center rounded-control border-2 border-border-strong bg-field hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <MoreHorizontal aria-hidden className="size-[18px]" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-control p-1.5">
              <DropdownMenuItem className="h-10 gap-2.5" onSelect={() => setImpersonating(true)}>
                <UserCog aria-hidden className="size-4" />
                {t("actions.impersonate")}
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="h-10 gap-2.5">
                <a href={storefrontUrl(org.slug, locale)} target="_blank" rel="noopener noreferrer">
                  <ExternalLink aria-hidden className="size-4" />
                  {t("actions.publicPage")}
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="h-10 gap-2.5 text-destructive focus:text-destructive" onSelect={() => setDeleting(true)}>
                <Trash2 aria-hidden className="size-4" />
                {t("actions.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {impersonating && <ImpersonateModal organization={org} onClose={() => setImpersonating(false)} />}
      <AlertDialog open={confirmSuspend} onOpenChange={setConfirmSuspend}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("suspendDialog.title", { name: org.name })}</AlertDialogTitle>
            <AlertDialogDescription>{t("suspendDialog.body")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">{t("suspendDialog.keep")}</AlertDialogCancel>
            <AlertDialogAction
              className="cursor-pointer bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                setConfirmSuspend(false);
                setStatus(false);
              }}
            >
              {t("suspendDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <DeleteOrganizationDialog
        open={deleting}
        org={{ name: org.name, cars: counts.cars, team: counts.team }}
        onClose={() => setDeleting(false)}
        onConfirm={remove}
        isDeleting={busy && deleting}
      />
    </header>
  );
}
