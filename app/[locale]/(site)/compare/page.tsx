"use client";

import { ComparePresenter } from "./_components/ComparePresenter";
import { useComparePage } from "@/hooks/use-compare-page";

const ComparePage = () => {
  const pageData = useComparePage();

  return <ComparePresenter {...pageData} />;
};

export default ComparePage;
