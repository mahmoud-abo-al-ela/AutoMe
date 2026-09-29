"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { getQueryClient } from "@/lib/query-client";

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Opt-in: its floating button sat on top of the chat bubble. Set
          NEXT_PUBLIC_QUERY_DEVTOOLS=1 in .env.local to bring it back. */}
      {process.env.NODE_ENV === "development" &&
        process.env.NEXT_PUBLIC_QUERY_DEVTOOLS === "1" && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
    </QueryClientProvider>
  );
}
