"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { UseFormRegister } from "react-hook-form";
import type { TestDriveFormValues } from "../../_lib/scheduling";

const NotesField = ({
    register,
    disabled,
}: {
    register: UseFormRegister<TestDriveFormValues>;
    disabled: boolean;
}) => {
    return (
        <div>
            <Label htmlFor="notes" className="block mb-2 font-medium">
                Additional Notes (Optional)
            </Label>
            <Textarea
                id="notes"
                placeholder="Any specific requirements or questions?"
                className="resize-none"
                disabled={disabled}
                {...register("notes")}
            />
        </div>
    );
};

export default NotesField;
