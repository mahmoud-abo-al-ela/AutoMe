"use client";

import { Button } from "@/components/ui/button";

const FormActions = ({
    onCancel,
    submitting,
    cancelText,
    submitText,
    loadingText,
    variant = "single",
}: {
    /** Required by the "split" variant, which is the only one with a cancel button. */
    onCancel?: () => void;
    submitting: boolean;
    /** Required by the "split" variant, for the same reason as onCancel. */
    cancelText?: string;
    /**
     * Required rather than defaulted, so the caller — which has a translation
     * scope — supplies the wording. A default here would be an English literal.
     */
    submitText: string;
    loadingText: string;
    variant?: "single" | "split";
}) => {
    if (variant === "split") {
        return (
            <div className="grid grid-cols-2 gap-3">
                <Button
                    type="button"
                    variant="outline"
                    className="cursor-pointer"
                    onClick={onCancel}
                    disabled={submitting}
                >
                    {cancelText}
                </Button>
                <Button
                    type="submit"
                    className="cursor-pointer"
                    disabled={submitting}
                >
                    {submitting ? (
                        <>
                            <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full me-2"></span>
                            {loadingText}
                        </>
                    ) : (
                        submitText
                    )}
                </Button>
            </div>
        );
    }

    return (
        <Button
            type="submit"
            className="w-full cursor-pointer"
            disabled={submitting}
        >
            {submitting ? (
                <>
                    <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full me-2"></span>
                    {loadingText}
                </>
            ) : (
                submitText
            )}
        </Button>
    );
};

export default FormActions;