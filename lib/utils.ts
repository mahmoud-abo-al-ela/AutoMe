import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// The theme's own scales (app/globals.css), registered so twMerge knows what
// they are. Unregistered, `text-body` reads as a text colour — so
// cn("text-body", "text-muted-foreground") silently dropped the size — and
// `rounded-control` never replaced the `rounded-md` it was meant to.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["display", "h1", "h2", "h3", "body", "caption", "micro"],
      radius: ["plate", "control", "sheet", "hero"],
      shadow: ["key", "key-pressed", "float"],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Maximum number of cars in a comparison. The one source for the limit the
 * compare tray enforces, the compare page's column count, and the FAQ's
 * answer about it.
 */
export const MAX_COMPARE_CARS = 3;

// Car comparison utilities
export const compareUtils = {
  getCompareList: (): string[] => {
    const compareList = localStorage.getItem("compareList");
    return compareList ? JSON.parse(compareList) : [];
  },

  addToCompare: (carId: string): boolean => {
    const compareList = compareUtils.getCompareList();
    if (compareList.includes(carId)) return false;
    if (compareList.length >= MAX_COMPARE_CARS) return false;
    compareList.push(carId);
    localStorage.setItem("compareList", JSON.stringify(compareList));
    return true;
  },

  removeFromCompare: (carId: string): boolean => {
    const compareList = compareUtils.getCompareList();
    const index = compareList.indexOf(carId);
    if (index === -1) return false;
    compareList.splice(index, 1);
    localStorage.setItem("compareList", JSON.stringify(compareList));
    return true;
  },

  clearCompareList: () => {
    localStorage.removeItem("compareList");
  },
};
