import React from "react";
import Link from "next/link";
import { Users, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const UserHeader = () => {
  return (
    <div className="flex sm:items-center gap-2 sm:gap-3 mb-4 sm:mb-6 items-center">
      <Button
        variant="ghost"
        size="sm"
        asChild
        className="h-7 w-7 sm:h-8 sm:w-8 p-0 sm:p-1"
      >
        <Link href="/admin/settings">
          <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
        </Link>
      </Button>
      <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
        <div className="bg-green-50 p-1.5 sm:p-2 rounded-lg">
          <Users className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-green-600" />
        </div>
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
            Users
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-gray-500">
            Manage accounts and their permissions
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserHeader;
