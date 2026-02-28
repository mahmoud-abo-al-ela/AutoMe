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
        <div className="flex items-center justify-between mb-4 px-1">
            <p className="text-sm text-muted-foreground">
                Showing{" "}
                <span className="font-medium text-foreground">
                    {start}-{end}
                </span>{" "}
                of{" "}
                <span className="font-medium text-foreground">
                    {total.toLocaleString()}
                </span>{" "}
                cars
            </p>

            <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground hidden sm:inline">
                    Sort:
                </span>
                <Select
                    value={sortBy}
                    onValueChange={(value) => !isLoading && onSortChange(value)}
                    disabled={isLoading}
                >
                    <SelectTrigger className="w-[160px] h-8 text-sm cursor-pointer">
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
