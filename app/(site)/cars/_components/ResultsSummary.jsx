import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export const ResultsSummary = ({
    currentPage,
    limit,
    total,
    sortBy,
    onSortChange,
    isLoading,
}) => {
    const start = (currentPage - 1) * limit + 1;
    const end = Math.min(currentPage * limit, total);

    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 px-4 py-3 bg-white/60 backdrop-blur-md border border-slate-200/60 rounded-xl shadow-sm gap-3 sm:gap-0">
            <p className="text-sm text-slate-600 flex items-center">
                <span>Showing</span>
                <span className="font-bold text-slate-900 mx-1.5 px-1.5 py-0.5 bg-white rounded shadow-sm border border-slate-100">
                    {start}-{end}
                </span>
                <span>of</span>
                <span className="font-bold text-primary mx-1.5">
                    {total.toLocaleString()}
                </span>
                <span>vehicles</span>
            </p>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <span className="text-sm font-medium text-slate-500 hidden sm:inline">
                    Sort by:
                </span>
                <Select
                    value={sortBy}
                    onValueChange={(value) => !isLoading && onSortChange(value)}
                    disabled={isLoading}
                >
                    <SelectTrigger className="w-full sm:w-[180px] h-9 text-sm cursor-pointer bg-white border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
                        <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="newest" className="cursor-pointer">
                            Newest First
                        </SelectItem>
                        <SelectItem value="priceAsc" className="cursor-pointer">
                            Price: Low to High
                        </SelectItem>
                        <SelectItem value="priceDesc" className="cursor-pointer">
                            Price: High to Low
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
};

export default ResultsSummary;
