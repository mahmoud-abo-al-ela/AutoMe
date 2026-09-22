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

/**
 * Input types whose direction the browser decides for itself.
 *
 * Chromium and WebKit set `direction: ltr` on these from their own stylesheet,
 * so on an Arabic page the phone and email fields end up with their text,
 * placeholder and caret at the left while every other field sits at the right.
 * The `dir` attribute does not fix it — a UA rule outranks it — but an author
 * rule does, which is why this is a class.
 */
const UA_FORCED_LTR_TYPES = new Set(["tel", "email", "url"]);

/**
 * Apply a field's `display` rewrite to what is in the input, keeping the caret
 * where the typist left it.
 *
 * Rewriting `value` alone would send the caret to the end on every keystroke,
 * which makes correcting a digit in the middle of a phone number impossible.
 * Counting how much of the text *before* the caret survives the rewrite gives
 * the position it belongs at afterwards.
 */
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
                        <Label htmlFor={field.id} className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            {t(`fields.${field.id}.label`)}
                            {field.required ? (
                                <span className="text-red-500">*</span>
                            ) : (
                                <span className="text-xs font-normal text-gray-400">
                                    {t("optional")}
                                </span>
                            )}
                        </Label>
                        <div className="relative">
                            <div className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
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
                                    : "border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                                    }`}
                            />
                        </div>
                        {errors[field.id] && (
                            <motion.p
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-sm text-red-600 flex items-center gap-1"
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
