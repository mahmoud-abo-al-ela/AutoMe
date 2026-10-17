import type { ReactNode } from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export type FaqItem = { id: string; question: ReactNode; answer: ReactNode };

export function FaqAccordion({ items, className }: { items: FaqItem[]; className?: string }) {
  return (
    <AccordionPrimitive.Root type="single" collapsible className={cn("border-t border-border", className)}>
      {items.map((item) => (
        <AccordionPrimitive.Item key={item.id} value={item.id} className="border-b border-border">
          <AccordionPrimitive.Header>
            <AccordionPrimitive.Trigger className="group flex w-full cursor-pointer items-center justify-between gap-4 py-5 text-start outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
              <span className="text-[1.0625rem] font-semibold">{item.question}</span>
              <Plus aria-hidden className="size-5 shrink-0 group-data-[state=open]:hidden" />
              <Minus aria-hidden className="size-5 shrink-0 group-data-[state=closed]:hidden" />
            </AccordionPrimitive.Trigger>
          </AccordionPrimitive.Header>
          <AccordionPrimitive.Content forceMount className="data-[state=closed]:hidden">
            <div className="pb-5 text-body text-muted-foreground">{item.answer}</div>
          </AccordionPrimitive.Content>
        </AccordionPrimitive.Item>
      ))}
    </AccordionPrimitive.Root>
  );
}
