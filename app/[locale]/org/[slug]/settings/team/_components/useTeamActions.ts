import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateMemberRole, removeMember } from "@/actions/team";
import { queryKeys } from "@/lib/query-client";
import type { TeamMember, TeamMemberRole } from "../_lib/team-types";

export function useTeamActions(organizationId: string) {
    const tRemove = useTranslations("org.settings.team.remove");
    const tRole = useTranslations("org.settings.team.roleChange");
    const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);
    const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
    const queryClient = useQueryClient();

    const { isPending: loadingRoleUpdate, mutateAsync: updateRoleFn } = useMutation({
        mutationFn: updateMemberRole,
    });
    const { isPending: loadingRemove, mutateAsync: removeMemberFn } = useMutation({
        mutationFn: removeMember,
    });

    const handleRemoveMember = (member: TeamMember) => {
        if (member.role === "OWNER") {
            toast.error(tRemove("ownerBlocked"));
            return;
        }

        setMemberToRemove(member);
        setRemoveDialogOpen(true);
    };

    const confirmRemoveMember = async () => {
        if (!memberToRemove) return;

        try {
            const response = await removeMemberFn({
                organizationId,
                memberId: memberToRemove.id,
            });

            setRemoveDialogOpen(false);
            setMemberToRemove(null);

            if (response?.success) {
                toast.success(tRemove("removed"));
                queryClient.invalidateQueries({ queryKey: queryKeys.team.members(organizationId) });
            } else {
                toast.error(response?.error?.message || tRemove("failed"));
            }
        } catch (error) {
            console.error("Remove member error:", error);
            toast.error(tRemove("unexpected"));
            setRemoveDialogOpen(false);
            setMemberToRemove(null);
        }
    };

    const handleRoleChange = async (memberId: string, newRole: TeamMemberRole) => {
        try {
            const response = await updateRoleFn({
                organizationId,
                memberId,
                newRole,
            });

            if (response?.success) {
                toast.success(tRole("updated"));
                queryClient.invalidateQueries({ queryKey: queryKeys.team.members(organizationId) });
            } else {
                toast.error(response?.error?.message || tRole("failed"));
            }
        } catch (error) {
            console.error("Update role error:", error);
            toast.error(tRole("unexpected"));
        }
    };

    return {
        memberToRemove,
        removeDialogOpen,
        setRemoveDialogOpen,
        loadingRoleUpdate,
        loadingRemove,
        handleRemoveMember,
        confirmRemoveMember,
        handleRoleChange,
    };
}
