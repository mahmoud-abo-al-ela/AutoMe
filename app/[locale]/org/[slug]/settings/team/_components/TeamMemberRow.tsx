"use client";

import { useTranslations } from "next-intl";
import { Crown } from "lucide-react";
import { useFormatters } from "@/hooks/use-formatters";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { inputClass } from "../../../_components/form-ui";
import type { TeamMember, TeamMemberRole } from "../_lib/team-types";

interface TeamMemberRowProps {
  member: TeamMember;
  currentUserId: string;
  /** Whether the *viewer* owns the organization, not this row's member. */
  isOwner: boolean;
  onRemove: (member: TeamMember) => void;
  onRoleChange: (memberId: string, newRole: TeamMemberRole) => void;
  loadingRoleUpdate: boolean;
}

/** One person: who they are, when they joined, their role (an owner can change it), and Remove. */
export default function TeamMemberRow({
  member,
  currentUserId,
  isOwner,
  onRemove,
  onRoleChange,
  loadingRoleUpdate,
}: TeamMemberRowProps) {
  const t = useTranslations("org.settings.team");
  const { relativeToNow } = useFormatters();
  const isCurrentUser = member.userId === currentUserId;
  const isOwnerRole = member.role === "OWNER";
  const name = member.user.name || t("noName");

  return (
    <li className="flex flex-col gap-3 py-3.5 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar className="size-11">
          <AvatarImage src={member.user.imageUrl ?? undefined} alt="" />
          <AvatarFallback className="bg-[#e7eef8] font-bold text-[#1d4e9e]">
            {(member.user.name || member.user.email || "?").charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-col">
          <p className="flex flex-wrap items-center gap-2 font-semibold">
            <bdi>{name}</bdi>
            {isCurrentUser && (
              <span className="rounded-full bg-muted px-2 py-px text-micro font-semibold text-muted-foreground">{t("you")}</span>
            )}
          </p>
          <p className="truncate text-caption text-muted-foreground">
            {member.user.email && (
              <>
                <bdi>{member.user.email}</bdi>
                {". "}
              </>
            )}
            {t("joined", { when: relativeToNow(new Date(member.user.createdAt)) })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:shrink-0">
        {isOwner && !isOwnerRole ? (
          <Select
            value={member.role}
            // Radix hands back a plain string; only the two roles below are rendered as items.
            onValueChange={(value) => onRoleChange(member.id, value as TeamMemberRole)}
            disabled={loadingRoleUpdate}
          >
            <SelectTrigger aria-label={t("roleOf", { name })} className={`${inputClass()} w-36 justify-between`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MEMBER">{t("roles.MEMBER")}</SelectItem>
              <SelectItem value="OWNER">{t("roles.OWNER")}</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <span
            className={
              isOwnerRole
                ? "inline-flex items-center gap-1.5 rounded-full bg-[#fff1c2] px-2.5 py-1 text-micro font-bold text-[#8a5e00]"
                : "rounded-full bg-muted px-2.5 py-1 text-micro font-semibold text-muted-foreground"
            }
          >
            {isOwnerRole && <Crown aria-hidden className="size-3.5" />}
            {t(`roles.${member.role}`)}
          </span>
        )}

        {isOwner && !isOwnerRole && !isCurrentUser && (
          <Button
            variant="ghost"
            size="control"
            onClick={() => onRemove(member)}
            className="h-11 text-destructive hover:bg-destructive-soft hover:text-destructive"
            aria-label={t("remove.labelFor", { name })}
          >
            {t("remove.label")}
          </Button>
        )}
      </div>
    </li>
  );
}
