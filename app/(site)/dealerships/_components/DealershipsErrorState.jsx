import { Button } from "@/components/ui/button";

export const DealershipsErrorState = ({ error }) => {
    return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-red-800 mb-2">
                Error loading dealerships
            </h3>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
                Try Again
            </Button>
        </div>
    );
};
