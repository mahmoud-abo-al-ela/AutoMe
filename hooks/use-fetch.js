import { useState } from "react";
import { toast } from "sonner";

const useFetch = (cb, initialLoading = false) => {
  const [data, setData] = useState(undefined);
  const [loading, setLoading] = useState(initialLoading);
  const [error, setError] = useState(null);
  const fn = async (...args) => {
    setLoading(true);
    setError(null);

    try {
      const response = await cb(...args);
      setData(response);

      // If the response has success: false, treat it as an error
      if (response && response.success === false) {
        setError(response.error || "An error occurred");
        return response;
      }

      setError(null);
      return response;
    } catch (error) {
      const errorMessage = error.message || "An unexpected error occurred";
      setError(errorMessage);
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, fn, setData };
};

export default useFetch;
