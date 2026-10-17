"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { XCircle } from "lucide-react";
import type { ReactNode } from "react";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import type { OrgDetailsFormValues } from "./useOrgDetails";
import type { OrgInputField } from "./constants";

const UA_FORCED_LTR_TYPES = new Set(["tel", "email", "url"]);

function rewriteInput(
    input: HTMLInputElement,
    display?: (value: string) => string
) {
    if (!display) return;

    const caret = input.selectionStart ?? input.value.length;
    const rewritten = display(input.value);
    if (rewritten === input.value) return;

    const caretAfter = display(input.value.slice(0, caret)).length;
    input.value = rewritten;
    input.setSelectionRange(caretAfter, caretAfter);
}

export default function FormFields({
    fields,
    register,
    errors,
    columns = 2,
    footerSlot,
    bare = false,
}: {
    fields: OrgInputField[];
    register: UseFormRegister<OrgDetailsFormValues>;
    errors: FieldErrors<OrgDetailsFormValues>;
    columns?: number;
    footerSlot?: ReactNode;
    bare?: boolean;
}) {
    const t = useTranslations("onboarding.orgDetails");

    const cells = (
        <>
            {fields.map((field, index) => {
                const Icon = field.icon;
                const registration = register(
                    field.id,
                    field.normalize ? { setValueAs: field.normalize } : undefined
                );
                return (
                    <motion.div
                        key={field.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        className="space-y-2"
                    >
                        <Label htmlFor={field.id} className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                            {t(`fields.${field.id}.label`)}
                            {field.required ? (
                                <span className="text-destructive">*</span>
                            ) : (
                                <span className="text-xs font-normal text-muted-foreground">
                                    {t("optional")}
                                </span>
                            )}
                        </Label>
                        <div className="relative">
                            <div className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                                <Icon className="h-5 w-5" />
                            </div>
                            <Input
                                id={field.id}
                                type={field.type || "text"}
                                placeholder={t(`fields.${field.id}.placeholder`)}
                                {...registration}
                                onChange={(event) => {
                                    rewriteInput(event.target, field.display);
                                    return registration.onChange(event);
                                }}
                                className={`ps-10 h-12 text-base transition-all duration-300 ${
                                    UA_FORCED_LTR_TYPES.has(field.type ?? "")
                                        ? "rtl:[direction:rtl] rtl:text-right"
                                        : ""
                                    } ${errors[field.id]
                                    ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                                    : "border-border focus:border-primary/30 focus:ring-primary/20"
                                    }`}
                            />
                        </div>
                        {errors[field.id] && (
                            <motion.p
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-sm text-destructive flex items-center gap-1"
                            >
                                <XCircle className="h-4 w-4" />
                                {errors[field.id]?.message}
                            </motion.p>
                        )}
                        {field.id === "name" && footerSlot}
                    </motion.div>
                );
            })}
        </>
    );

    if (bare) return cells;

    return (
        <div className={`grid gap-6 ${columns === 2 ? "sm:grid-cols-2" : ""}`}>
            {cells}
        </div>
    );
}
