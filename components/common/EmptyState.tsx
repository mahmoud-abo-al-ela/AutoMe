import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { SearchX, FilterX } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type EmptyStateProps = {
    variant?: "standalone" | "inline" | "filtered";
    icon?: LucideIcon;
    title?: string;
    description?: string;
    actionLabel?: string;
    actionHref?: string;
    onAction?: () => void;
    secondaryActionLabel?: string;
    secondaryActionHref?: string;
    onSecondaryAction?: () => void;
    onClearFilters?: () => void;
    className?: string;
};

export const EmptyState = ({
    variant = "standalone", // standalone, inline, filtered
    icon: Icon,
    title,
    description,
    actionLabel,
    actionHref,
    onAction,
    secondaryActionLabel,
    secondaryActionHref,
    onSecondaryAction,
    onClearFilters,
    className = "",
}: EmptyStateProps) => {
    const isFiltered = variant === "filtered";
    const DisplayIcon = isFiltered ? (Icon || FilterX) : Icon;

    if (variant === "inline") {
        return (
            <div className={cn("flex flex-col items-center justify-center py-8 px-4 text-center animate-empty-entrance", className)}>
                {DisplayIcon && (
                    <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-full mb-3">
                        <DisplayIcon className="h-6 w-6 text-slate-400 dark:text-slate-500" strokeWidth={1.5} />
                    </div>
                )}
                <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-1">{title}</h3>
                {description && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 max-w-sm mx-auto">
                        {description}
                    </p>
                )}
                <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                    {actionLabel && actionHref && (
                        <Link href={actionHref}>
                            <Button size="sm" variant="outline" className="cursor-pointer">{actionLabel}</Button>
                        </Link>
                    )}
                    {actionLabel && onAction && (
                        <Button size="sm" variant="outline" onClick={onAction} className="cursor-pointer">
                            {actionLabel}
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    if (isFiltered) {
        return (
            <div className={cn("flex flex-col items-center justify-center py-16 px-4 text-center animate-empty-entrance", className)}>
                <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-4">
                    <SearchX className="h-8 w-8 text-slate-400 dark:text-slate-500" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    {title || "No results found"}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
                    {description || "Try adjusting your search or filters to find what you're looking for."}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                    {onClearFilters && (
                        <Button onClick={onClearFilters} variant="default" className="cursor-pointer">
                            Clear Filters
                        </Button>
                    )}
                    {actionLabel && actionHref && (
                        <Link href={actionHref}>
                            <Button variant="outline" className="cursor-pointer">{actionLabel}</Button>
                        </Link>
                    )}
                    {actionLabel && onAction && (
                        <Button variant="outline" onClick={onAction} className="cursor-pointer">
                            {actionLabel}
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    // Default standalone variant
    return (
        <div className={cn("flex flex-col items-center justify-center py-20 px-4 text-center bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-sm animate-empty-entrance relative overflow-hidden", className)}>
            {/* Decorative background circles */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-blue-400/10 rounded-full blur-2xl pointer-events-none" />
            
            {DisplayIcon && (
                <div className="relative z-10 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/40 dark:to-purple-900/40 p-5 rounded-full mb-6 shadow-inner">
                    <DisplayIcon className="h-10 w-10 md:h-12 md:w-12 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
                </div>
            )}
            
            <h3 className="relative z-10 text-xl md:text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-3">
                {title}
            </h3>
            
            {description && (
                <p className="relative z-10 text-base text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto leading-relaxed">
                    {description}
                </p>
            )}
            
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
                {actionLabel && actionHref && (
                    <Link href={actionHref} className="w-full sm:w-auto">
                        <Button className="w-full sm:w-auto cursor-pointer">{actionLabel}</Button>
                    </Link>
                )}
                {actionLabel && onAction && (
                    <Button onClick={onAction} className="w-full sm:w-auto cursor-pointer">
                        {actionLabel}
                    </Button>
                )}
                
                {secondaryActionLabel && secondaryActionHref && (
                    <Link href={secondaryActionHref} className="w-full sm:w-auto">
                        <Button variant="outline" className="w-full sm:w-auto cursor-pointer">{secondaryActionLabel}</Button>
                    </Link>
                )}
                {secondaryActionLabel && onSecondaryAction && (
                    <Button variant="outline" onClick={onSecondaryAction} className="w-full sm:w-auto cursor-pointer">
                        {secondaryActionLabel}
                    </Button>
                )}
            </div>
        </div>
    );
};
