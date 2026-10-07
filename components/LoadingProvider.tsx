"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { isSuperAdminPath } from "@/lib/org/client";
import Loading from "./Loading";

type LoadingContextValue = {
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
};

const LoadingContext = createContext<LoadingContextValue>({
  isLoading: true,
  setIsLoading: () => {},
});

export const useLoading = () => useContext(LoadingContext);

export default function LoadingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  // The first-load splash covers a page that has already rendered, until the
  // browser's load event plus 800ms. The public site does not take it: its
  // pages are server-rendered and readable at once, and its real waits show
  // the road loader (app/[locale]/loading.tsx and the route loading files).
  // The dealer dashboard is on the site theme now and does the same; only
  // the super-admin keeps the splash.
  const showsSplash = isSuperAdminPath(usePathname());

  useEffect(() => {
    // Check if document is fully loaded
    if (document.readyState === "complete") {
      // Give a slight delay to ensure all resources are rendered
      setTimeout(() => {
        setIsLoading(false);
        setIsFirstLoad(false);
      }, 800);
    } else {
      // Add event listener for when the page is fully loaded
      const handleLoad = () => {
        setTimeout(() => {
          setIsLoading(false);
          setIsFirstLoad(false);
        }, 800);
      };

      window.addEventListener("load", handleLoad);

      return () => {
        window.removeEventListener("load", handleLoad);
      };
    }
  }, []);

  return (
    <LoadingContext.Provider value={{ isLoading, setIsLoading }}>
      {showsSplash && isLoading && isFirstLoad && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Loading />
        </div>
      )}
      {children}
    </LoadingContext.Provider>
  );
}
