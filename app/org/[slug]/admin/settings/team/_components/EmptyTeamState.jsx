import { Users } from "lucide-react";

export default function EmptyTeamState() {
    return (
        <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-2 text-gray-400" />
            <p className="text-sm sm:text-base">No team members yet</p>
            <p className="text-xs text-gray-400 mt-1">
                Invite members to collaborate with your organization
            </p>
        </div>
    );
}
