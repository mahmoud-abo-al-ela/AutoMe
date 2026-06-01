import React from "react";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const PriceRangeFilter = ({
  priceRange,
  setPriceRange,
  onPriceCommit,
  maxPriceValue,
  formatPrice,
  isLoading,
}) => {
  return (
    <AccordionItem value="price" className="border-none">
      <AccordionTrigger className="py-2 hover:no-underline cursor-pointer">
        <span className="text-sm font-medium">Price Range</span>
        {(priceRange[0] > 0 ||
          (priceRange[1] < maxPriceValue &&
            priceRange[1] > 0 &&
            maxPriceValue > 0)) && (
            <Badge
              variant="secondary"
              className="ml-2 bg-primary/10 text-primary"
            >
              Set
            </Badge>
          )}
      </AccordionTrigger>
      <AccordionContent>
        <div className="pt-2 pb-3">
          <div className="flex justify-between items-center mb-4">
            <div className="bg-slate-100 border border-slate-200 rounded-md px-3 py-1.5 text-xs font-semibold text-slate-700">
              {formatPrice(priceRange[0] || 0)}
            </div>
            <div className="h-px bg-slate-300 w-4 mx-2"></div>
            <div className="bg-slate-100 border border-slate-200 rounded-md px-3 py-1.5 text-xs font-semibold text-slate-700">
              {formatPrice(priceRange[1] || maxPriceValue || 0)}
            </div>
          </div>
          <Slider
            defaultValue={[0, maxPriceValue || 100000]}
            max={maxPriceValue || 100000}
            min={0}
            step={1000}
            value={priceRange}
            onValueChange={(value) => !isLoading && setPriceRange(value)}
            onValueCommit={(value) => !isLoading && onPriceCommit && onPriceCommit(value)}
            disabled={isLoading || maxPriceValue === 0}
            className="mb-2"
          />
          {maxPriceValue === 0 && (
            <div className="text-xs text-muted-foreground text-center">
              Loading price range...
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export default PriceRangeFilter;
