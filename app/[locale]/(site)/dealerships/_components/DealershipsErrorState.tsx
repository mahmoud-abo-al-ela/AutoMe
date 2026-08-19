import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export const DealershipsErrorState = ({
    error,
    onRetry,
}: {
    error?: string;
    onRetry?: () => void;
}) => {
    const handleRetry = () => {
        if (onRetry) {
            onRetry();
        } else if (typeof window !== "undefined") {
            window.location.reload();
        }
    };

    return (
        <div
            role="alert"
            className="rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-center"
        >
            <h3 className="mb-2 text-lg font-semibold text-destructive">
                Error loading dealerships
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
                {error || "Something went wrong while loading dealerships."}
            </p>
            <Button onClick={handleRetry} variant="outline" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
            </Button>
        </div>
    );
};

export default DealershipsErrorState;
