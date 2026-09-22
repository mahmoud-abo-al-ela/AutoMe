"use client";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { ArrowLeft, Users } from "lucide-react";
import { useParams } from "next/navigation";

interface TeamHeaderProps {
  memberCount: number;
  /** -1 means unlimited; undefined when the organization has no active plan. */
  memberLimit: number | undefined;
}

export default function TeamHeader({
  memberCount,
  memberLimit,
}: TeamHeaderProps) {
  const { slug } = useParams();
  return (
    <div className="flex sm:items-center gap-2 sm:gap-3 mb-4 sm:mb-6 items-center">
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/org/${slug}/settings`}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </Button>
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="bg-green-50 p-2 rounded-lg">
          <Users className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
        </div>
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900">
            Team Members
          </h1>
          <p className="text-xs sm:text-base text-gray-500">
            {memberCount} of {memberLimit === -1 ? "unlimited" : memberLimit} members
          </p>
        </div>
      </div>
    </div>
  );
}
