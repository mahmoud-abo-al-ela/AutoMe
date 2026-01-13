"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Info } from "lucide-react";

const TestDriveEmptyState = () => {
    const router = useRouter();

    return (
        <Card className="p-6">
            <div className="flex flex-col items-center justify-center text-center py-8">
                <Info className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No test drive selected</h3>
                <p className="text-muted-foreground mb-4">
                    Please select a test drive from your list or schedule a new one.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                        onClick={() => router.push("/test-drive")}
                        variant="outline"
                        className="cursor-pointer"
                    >
                        View All Test Drives
                    </Button>
                    <Button
                        onClick={() => router.push("/cars")}
                        className="cursor-pointer"
                    >
                        Browse Cars
                    </Button>
                </div>
            </div>
        </Card>
    );
};

export default TestDriveEmptyState;