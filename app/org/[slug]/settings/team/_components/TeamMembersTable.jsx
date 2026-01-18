"use client";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Toaster } from "sonner";
import TeamMemberRow from "./TeamMemberRow";
import EmptyTeamState from "./EmptyTeamState";
import RemoveMemberDialog from "./RemoveMemberDialog";
import { useTeamActions } from "./useTeamActions";

export default function TeamMembersTable({
    members,
    currentUserId,
    isOwner,
    organizationId,
}) {
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

    return (
        <>
            <Toaster richColors position="top-right" expand={true} />
            <Card className="overflow-hidden gap-3">
                <CardHeader className="text-center sm:text-left">
                    <CardTitle className="text-lg sm:text-xl">Team Members</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                        Manage your team members and their roles within the organization.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-3">
                    {members.length === 0 ? (
                        <EmptyTeamState />
                    ) : (
                        <div className="space-y-4">
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
                        </div>
                    )}
                </CardContent>
            </Card>

            <RemoveMemberDialog
                isOpen={removeDialogOpen}
                onClose={setRemoveDialogOpen}
                member={memberToRemove}
                onConfirm={confirmRemoveMember}
                isLoading={loadingRemove}
            />
        </>
    );
}
