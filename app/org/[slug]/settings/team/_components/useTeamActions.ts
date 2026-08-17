import { useState } from "react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateMemberRole, removeMember } from "@/actions/team";
import { queryKeys } from "@/lib/query-client";
import type { TeamMember, TeamMemberRole } from "../_lib/team-types";

export function useTeamActions(organizationId: string) {
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
            toast.error("Cannot remove the organization owner");
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
                toast.success("Member removed successfully");
                queryClient.invalidateQueries({ queryKey: queryKeys.team.members(organizationId) });
            } else {
                toast.error(response?.error?.message || "Failed to remove member");
            }
        } catch (error) {
            console.error("Remove member error:", error);
            toast.error("An error occurred while removing the member");
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
                toast.success("Member role updated successfully");
                queryClient.invalidateQueries({ queryKey: queryKeys.team.members(organizationId) });
            } else {
                toast.error(
                    response?.error?.message || "Failed to update member role"
                );
            }
        } catch (error) {
            console.error("Update role error:", error);
            toast.error("An error occurred while updating the role");
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
