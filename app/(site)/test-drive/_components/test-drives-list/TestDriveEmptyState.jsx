"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { useRouter } from "next/navigation";

const TestDriveEmptyState = ({ searchQuery, onClearSearch }) => {
    const router = useRouter();

    if (searchQuery) {
        return (
            <Card className="p-4 sm:p-6 text-center">
                <p className="text-sm sm:text-base text-muted-foreground">
                    No test drives match your search.
                </p>
                <Button
                    variant="link"
                    onClick={onClearSearch}
                    className="text-sm sm:text-base cursor-pointer"
                >
                    Clear search
                </Button>
            </Card>
        );
    }

    return (
        <Card className="p-4 sm:p-8 border-dashed border-2">
            <div className="flex flex-col items-center justify-center text-center">
                <div className="bg-gray-100 p-3 sm:p-4 rounded-full mb-3 sm:mb-4">
                    <Calendar className="h-8 w-8 sm:h-10 sm:w-10 text-gray-500" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2">
                    No test drives found
                </h3>
            </div>
        </Card>
    );
};

export default TestDriveEmptyState;