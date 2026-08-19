import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useParams } from "next/navigation";

export default function WorkingHoursHeader() {
    const { slug } = useParams();
    return (
        <div className="flex sm:items-center gap-2 sm:gap-3 mb-4 sm:mb-6 items-center">
            <Button variant="ghost" size="sm" asChild>
                <Link href={`/org/${slug}/settings`}>
                    <ArrowLeft className="h-4 w-4" />
                </Link>
            </Button>
            <div className="flex items-center gap-2 sm:gap-3">
                <div className="bg-blue-50 p-2 rounded-lg">
                    <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>
                <div>
                    <h1 className="text-xl sm:text-3xl font-bold text-gray-900">
                        Working Hours
                    </h1>
                    <p className="text-xs sm:text-base text-gray-500">
                        Configure your business operating hours
                    </p>
                </div>
            </div>
        </div>
    );
}
