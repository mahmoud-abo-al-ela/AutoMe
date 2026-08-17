import { QueryClient } from "@tanstack/react-query";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        gcTime: 5 * 60 * 1000, // 5 minutes
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}
export const queryKeys = {
  cars: {
    all: ["cars"],
    list: (filters: unknown) => ["cars", "list", filters],
    detail: (id: string) => ["cars", "detail", id],
    filters: (filters: unknown = {}) => ["cars", "filters", filters],
    featured: () => ["cars", "featured"],
  },
  dealerships: {
    all: ["dealerships"],
    list: (filters: unknown) => ["dealerships", "list", filters],
    detail: (slug: string) => ["dealerships", "detail", slug],
    filters: (filters: unknown = {}) => ["dealerships", "filters", filters],
  },
  testDrives: {
    all: ["testDrives"],
    list: (filters: unknown) => ["testDrives", "list", filters],
    detail: (id: string) => ["testDrives", "detail", id],
    check: (carId: string) => ["testDrives", "check", carId],
    workingHours: (carId: string) => ["testDrives", "workingHours", carId],
  },
  wishlist: {
    all: ["wishlist"],
    list: (params: unknown) => ["wishlist", "list", params],
  },
  compare: {
    byIds: (ids: string[]) => ["compare", [...ids].sort()],
  },
  team: {
    members: (orgId: string) => ["team", "members", orgId],
  },
  dashboard: {
    planUsage: (resource: string) => ["dashboard", "planUsage", resource],
    dealership: () => ["dashboard", "dealership"],
  },
};
