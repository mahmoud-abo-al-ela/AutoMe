"use client";

import { Button } from "@/components/ui/button";

const FormActions = ({
    onCancel,
    submitting,
    cancelText = "Cancel",
    submitText = "Submit",
    loadingText = "Processing...",
    variant = "single", // "single" or "split"
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
                            <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></span>
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
                    <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></span>
                    {loadingText}
                </>
            ) : (
                submitText
            )}
        </Button>
    );
};

export default FormActions;