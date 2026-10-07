"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

/** "Mariam Adel" → "MA", "مريم عادل" → "م ع": the first letter of the first two words. */
export function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  const arabic = /[؀-ۿ]/.test(name);
  return words.map((word) => Array.from(word)[0]?.toUpperCase() ?? "").join(arabic ? " " : "");
}

/**
 * A buyer in the desk: their photo or initials, with the car they are asking
 * about tucked at the corner, so a dealer reads "who, and about what" at once.
 */
export function BuyerAvatar({
  name,
  image,
  carImage,
  className,
}: {
  name: string;
  image?: string | null;
  carImage?: string | null;
  className?: string;
}) {
  return (
    <span aria-hidden className={cn("relative size-11 shrink-0", className)}>
      <span className="flex size-full items-center justify-center overflow-hidden rounded-full bg-[#e7eef8] text-caption font-extrabold text-[#1d4e9e]">
        {image ? <Image src={image} alt="" width={44} height={44} unoptimized className="size-full object-cover" /> : initials(name)}
      </span>
      {carImage && (
        <span className="absolute -bottom-1 -end-2 h-[18px] w-7 overflow-hidden rounded-[5px] border-2 border-card bg-muted">
          <Image src={carImage} alt="" fill sizes="28px" className="object-cover" />
        </span>
      )}
    </span>
  );
}
