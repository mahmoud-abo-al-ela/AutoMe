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
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-slate-50 border border-slate-200 rounded-xl shadow-sm">
            {Icon && (
                <div className="bg-primary/10 p-4 rounded-full mb-6">
                    <Icon className="h-8 w-8 md:h-10 md:w-10 text-primary" />
                </div>
            )}
            <h3 className="text-xl font-medium text-gray-900 mb-3">{title}</h3>
            {description && (
                <p className="text-base text-muted-foreground mb-8 max-w-md">
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
