import { useFormatters } from "@/hooks/use-formatters";
import { useTranslations } from "next-intl";
import { Calendar, Clock, Info } from "lucide-react";
import { TimeRange } from "@/components/common/TimeRange";
import type { TestDriveDetail } from "../../_lib/test-drive-types";

const TestDriveDetails = ({ testDrive }: { testDrive: TestDriveDetail }) => {
  const { date: fmtDate } = useFormatters();
    const t = useTranslations("testDrive.existing");
    const formatDate = (date: string | null) => {
        if (!date) return t("notAvailable");
        return fmtDate(new Date(date), { weekday: "long", month: "long" });
    };

    return (
        <div className="bg-primary-soft border border-primary/30 rounded-md p-2 md:p-4">
            <div className="flex items-start">
                <Info className="h-5 w-5 me-2 text-primary mt-0.5" />
                <div className="space-y-2">
                    <p className="font-medium text-primary">
                        {testDrive.car?.title}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div className="flex items-center text-sm text-primary">
                            <Calendar className="h-4 w-4 me-2" />
                            {formatDate(testDrive.date)}
                        </div>
                        <div className="flex items-center text-sm text-primary">
                            <Clock className="h-4 w-4 me-2" />
                            <TimeRange
                                start={testDrive.startTime}
                                end={testDrive.endTime}
                            />
                        </div>
                    </div>
                    {testDrive.notes && (
                        <div className="text-sm text-primary mt-2">
                            <p className="font-medium">{t("notes")}</p>
                            <p>{testDrive.notes}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TestDriveDetails;