import Link from "next/link";
import { Button } from "@/components/ui/button";

export const DealershipErrorState = ({ error }) => {
    return (
        <div className="container mx-auto py-8 px-4 mt-18">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <h3 className="text-lg font-semibold text-red-800 mb-2">
                    Error loading dealership
                </h3>
                <p className="text-red-600 mb-4">{error || "Dealership not found"}</p>
                <Link href="/dealerships">
                    <Button>Back to Dealerships</Button>
                </Link>
            </div>
        </div>
    );
};
