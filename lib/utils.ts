import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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
