"use client";

import { useTranslations } from "next-intl";
import { useFormatters } from "@/hooks/use-formatters";
import { SectionPanel } from "../../../_components/SectionPanel";
import TeamMemberRow from "./TeamMemberRow";
import RemoveMemberDialog from "./RemoveMemberDialog";
import InviteMemberButton from "./InviteMemberButton";
import { useTeamActions } from "./useTeamActions";
import type { TeamMember } from "../_lib/team-types";

interface TeamMembersTableProps {
  members: TeamMember[];
  currentUserId: string;
  isOwner: boolean;
  organizationId: string;
  /** -1 means unlimited; undefined when the organization has no active plan. */
  memberLimit: number | undefined;
  canAddMembers: boolean;
}

/** The people on the dealership's account, with the seats the plan allows. */
export default function TeamMembersTable({
  members,
  currentUserId,
  isOwner,
  organizationId,
  memberLimit,
  canAddMembers,
}: TeamMembersTableProps) {
  const t = useTranslations("org.settings.team");
  const { number } = useFormatters();
  const {
    memberToRemove,
    removeDialogOpen,
    setRemoveDialogOpen,
    loadingRoleUpdate,
    loadingRemove,
    handleRemoveMember,
    confirmRemoveMember,
    handleRoleChange,
  } = useTeamActions(organizationId);

  const seats = t("count", {
    count: number(members.length),
    limit: memberLimit === -1 || memberLimit === undefined ? t("unlimited") : number(memberLimit),
  });

  return (
    <div className="flex w-full flex-col gap-5">
      <SectionPanel
        title={t("cardTitle")}
        hint={seats}
        action={isOwner && <InviteMemberButton organizationId={organizationId} canAdd={canAddMembers} />}
      >
        <p className="mb-3 text-caption text-muted-foreground">{t("cardDescription")}</p>
        <ul className="flex flex-col divide-y divide-border">
          {members.map((member) => (
            <TeamMemberRow
              key={member.id}
              member={member}
              currentUserId={currentUserId}
              isOwner={isOwner}
              onRemove={handleRemoveMember}
              onRoleChange={handleRoleChange}
              loadingRoleUpdate={loadingRoleUpdate}
            />
          ))}
        </ul>
      </SectionPanel>

      <RemoveMemberDialog
        isOpen={removeDialogOpen}
        onClose={setRemoveDialogOpen}
        member={memberToRemove}
        onConfirm={confirmRemoveMember}
        isLoading={loadingRemove}
      />
    </div>
  );
}
