import Image from "next/image";
import { CarFront } from "lucide-react";
import { cn } from "@/lib/utils";

/** A listing's first photo, or a car outline where it has none. Decorative: the name beside it says which car. */
export function CarThumb({ src, className }: { src: string | null; className?: string }) {
  return (
    <span className={cn("relative flex shrink-0 items-center justify-center overflow-hidden rounded-[8px] bg-muted", className)}>
      {src ? (
        <Image src={src} alt="" fill sizes="96px" className="object-cover" />
      ) : (
        <CarFront aria-hidden className="size-5 text-muted-foreground" />
      )}
    </span>
  );
}
