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

let browserQueryClient = undefined;

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
    list: (filters) => ["cars", "list", filters],
    detail: (id) => ["cars", "detail", id],
    filters: (filters = {}) => ["cars", "filters", filters],
    featured: () => ["cars", "featured"],
  },
  testDrives: {
    all: ["testDrives"],
    list: (filters) => ["testDrives", "list", filters],
    detail: (id) => ["testDrives", "detail", id],
    check: (carId) => ["testDrives", "check", carId],
  },
  wishlist: {
    all: ["wishlist"],
    list: (params) => ["wishlist", "list", params],
  },
  compare: {
    byIds: (ids) => ["compare", [...ids].sort()],
  },
  team: {
    members: (orgId) => ["team", "members", orgId],
  },
  dashboard: {
    planUsage: (resource) => ["dashboard", "planUsage", resource],
    dealership: () => ["dashboard", "dealership"],
  },
};
