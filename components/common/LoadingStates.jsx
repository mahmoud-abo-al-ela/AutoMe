import CarCardSkeleton from "@/components/CarCardSkeleton";

export const LoadingGrid = ({ count = 6, columns = "lg:grid-cols-3" }) => (
    <div className={`grid grid-cols-1 sm:grid-cols-2 ${columns} gap-4 sm:gap-6`}>
        {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="animate-pulse bg-white border border-slate-100 rounded-2xl p-4 space-y-4 shadow-sm">
                <div className="bg-slate-200 h-48 rounded-xl w-full" />
                <div className="space-y-2">
                    <div className="bg-slate-200 h-4 w-3/4 rounded" />
                    <div className="bg-slate-200 h-4 w-1/2 rounded" />
                </div>
            </div>
        ))}
    </div>
);

export const LoadingList = ({ count = 5 }) => (
    <div className="space-y-4">
        {Array.from({ length: count }).map((_, index) => (
            <div
                key={index}
                className="animate-pulse bg-slate-100 rounded-lg h-24"
            />
        ))}
    </div>
);

export const LoadingCard = () => (
    <div className="animate-pulse bg-slate-100 rounded-lg p-6">
        <div className="h-6 bg-slate-200 rounded w-3/4 mb-4" />
        <div className="h-4 bg-slate-200 rounded w-1/2" />
    </div>
);
