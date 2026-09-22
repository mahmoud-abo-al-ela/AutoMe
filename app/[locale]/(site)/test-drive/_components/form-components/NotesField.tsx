"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTranslations } from "next-intl";
import type { UseFormRegister } from "react-hook-form";
import type { TestDriveFormValues } from "../../_lib/scheduling";

const NotesField = ({
    register,
    disabled,
}: {
    register: UseFormRegister<TestDriveFormValues>;
    disabled: boolean;
}) => {
    const t = useTranslations("testDrive.form");

    return (
        <div>
            <Label htmlFor="notes" className="block mb-2 font-medium">
                {t("notes")}
            </Label>
            <Textarea
                id="notes"
                placeholder={t("notesPlaceholder")}
                className="resize-none"
                disabled={disabled}
                {...register("notes")}
            />
        </div>
    );
};

export default NotesField;
