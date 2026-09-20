import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

export default function WorkingHoursHeader() {
    const t = useTranslations("org.settings");
    const { slug } = useParams();
    return (
        <div className="flex sm:items-center gap-2 sm:gap-3 mb-4 sm:mb-6 items-center">
            <Button variant="ghost" size="sm" asChild>
                <Link
                    href={`/org/${slug}/settings`}
                    aria-label={t("back")}
                >
                    {/* "Back" points at the reader's starting edge. */}
                    <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                </Link>
            </Button>
            <div className="flex items-center gap-2 sm:gap-3">
                <div className="bg-blue-50 p-2 rounded-lg">
                    <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>
                <div>
                    <h1 className="text-xl sm:text-3xl font-bold text-gray-900">
                        {t("workingHours.title")}
                    </h1>
                    <p className="text-xs sm:text-base text-gray-500">
                        {t("workingHours.subtitle")}
                    </p>
                </div>
            </div>
        </div>
    );
}
