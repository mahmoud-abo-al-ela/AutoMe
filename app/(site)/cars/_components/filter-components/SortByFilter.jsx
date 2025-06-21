import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const SortByFilter = ({ sortBy, setSortBy, isLoading }) => {
  return (
    <AccordionItem value="sort" className="border-none">
      <AccordionTrigger className="py-2 hover:no-underline cursor-pointer">
        <span className="text-sm font-medium">Sort By</span>
        {sortBy !== "newest" && (
          <Badge
            variant="secondary"
            className="ml-2 bg-primary/10 text-primary"
          >
            Set
          </Badge>
        )}
      </AccordionTrigger>
      <AccordionContent>
        <div className="pt-1 pb-2">
          <Select
            value={sortBy}
            onValueChange={(value) => !isLoading && setSortBy(value)}
            disabled={isLoading}
          >
            <SelectTrigger className="cursor-pointer">
              <SelectValue placeholder="Select sorting" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="priceAsc" className="cursor-pointer">
                Price: Low to High
              </SelectItem>
              <SelectItem value="priceDesc" className="cursor-pointer">
                Price: High to Low
              </SelectItem>
              <SelectItem value="newest" className="cursor-pointer">
                Newest First
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export default SortByFilter;
