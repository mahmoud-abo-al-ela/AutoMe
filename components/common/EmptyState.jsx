import { Button } from "@/components/ui/button";
import Link from "next/link";

export const EmptyState = ({
    icon: Icon,
    title,
    description,
    actionLabel,
    actionHref,
    onAction,
}) => {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white/50 backdrop-blur-sm border border-slate-200/60 rounded-2xl shadow-sm">
            {Icon && (
                <div className="bg-gradient-to-br from-blue-100 to-purple-100 p-5 rounded-full mb-6 shadow-inner">
                    <Icon className="h-10 w-10 md:h-12 md:w-12 text-blue-600" strokeWidth={1.5} />
                </div>
            )}
            <h3 className="text-xl md:text-2xl font-semibold text-slate-800 mb-3">{title}</h3>
            {description && (
                <p className="text-base text-slate-500 mb-8 max-w-md mx-auto leading-relaxed">
                    {description}
                </p>
            )}
            {(actionLabel && actionHref) && (
                <Link href={actionHref}>
                    <Button className="cursor-pointer">{actionLabel}</Button>
                </Link>
            )}
            {(actionLabel && onAction) && (
                <Button onClick={onAction} className="cursor-pointer">
                    {actionLabel}
                </Button>
            )}
        </div>
    );
};
