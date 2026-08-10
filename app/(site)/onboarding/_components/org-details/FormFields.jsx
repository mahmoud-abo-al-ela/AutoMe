"use client";

import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { XCircle } from "lucide-react";

/**
 * `bare` drops the grid wrapper so the fields become cells of a grid the caller
 * owns. Step 1 needs that: contact, location and address fields come from three
 * different components, and nesting a grid per component left their column edges
 * out of line with each other.
 */
export default function FormFields({ fields, register, errors, columns = 2, footerSlot, bare = false }) {
    const cells = (
        <>
            {fields.map((field, index) => {
                const Icon = field.icon;
                return (
                    <motion.div
                        key={field.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        className="space-y-2"
                    >
                        <Label htmlFor={field.id} className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            {field.label}
                            {field.required ? (
                                <span className="text-red-500">*</span>
                            ) : (
                                <span className="text-xs font-normal text-gray-400">
                                    Optional
                                </span>
                            )}
                        </Label>
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                <Icon className="h-5 w-5" />
                            </div>
                            <Input
                                id={field.id}
                                type={field.type || "text"}
                                placeholder={field.placeholder}
                                {...register(field.id)}
                                className={`pl-10 h-12 text-base transition-all duration-300 ${errors[field.id]
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
                                {errors[field.id].message}
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
