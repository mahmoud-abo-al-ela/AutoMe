import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Car comparison utilities
export const compareUtils = {
  getCompareList: (): string[] => {
    const compareList = localStorage.getItem("compareList");
    return compareList ? JSON.parse(compareList) : [];
  },

  addToCompare: (carId: string): boolean => {
    const compareList = compareUtils.getCompareList();
    if (compareList.includes(carId)) return false;
    if (compareList.length >= 3) return false;
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
