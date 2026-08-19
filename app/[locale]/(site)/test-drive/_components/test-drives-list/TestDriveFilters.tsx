"use client";

import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, X } from "lucide-react";

const TestDriveFilters = ({
    searchQuery,
    onSearchChange,
    statusFilter,
    onStatusChange,
    onClearSearch,
}: {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    statusFilter: string;
    onStatusChange: (status: string) => void;
    onClearSearch: () => void;
}) => {
    return (
        <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
                <div className="relative flex-1">
                    <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search by car or date..."
                        className="ps-10 pe-10 text-sm"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                    {searchQuery && (
                        <button
                            onClick={onClearSearch}
                            className="absolute end-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                <div className="flex-shrink-0 w-full md:w-auto">
                    <Tabs
                        value={statusFilter}
                        defaultValue="all"
                        className="w-full"
                        onValueChange={onStatusChange}
                    >
                        <TabsList className="grid grid-cols-4 w-full gap-0.5 sm:gap-1">
                            <TabsTrigger
                                key="all"
                                value="all"
                                className="text-xs sm:text-sm px-1 sm:px-3 cursor-pointer"
                            >
                                All
                            </TabsTrigger>
                            <TabsTrigger
                                key="PENDING"
                                value="PENDING"
                                className="text-xs sm:text-sm px-1 sm:px-3 cursor-pointer"
                            >
                                Pending
                            </TabsTrigger>
                            <TabsTrigger
                                key="CONFIRMED"
                                value="CONFIRMED"
                                className="text-xs sm:text-sm px-1 sm:px-3 cursor-pointer"
                            >
                                Confirmed
                            </TabsTrigger>
                            <TabsTrigger
                                key="CANCELLED"
                                value="CANCELLED"
                                className="text-xs sm:text-sm px-1 sm:px-3 cursor-pointer"
                            >
                                Cancelled
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </div>
        </div>
    );
};

export default TestDriveFilters;