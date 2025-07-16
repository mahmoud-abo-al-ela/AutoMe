"use client";

import { createContext, useContext, useState, useEffect } from "react";
import Loading from "./Loading";

const LoadingContext = createContext({
  isLoading: true,
  setIsLoading: () => {},
});

export const useLoading = () => useContext(LoadingContext);

export default function LoadingProvider({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

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
      {isLoading && isFirstLoad && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Loading />
        </div>
      )}
      {children}
    </LoadingContext.Provider>
  );
}
