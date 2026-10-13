"use client";

import { ComparePresenter } from "./_components/ComparePresenter";
import { useComparePage } from "@/hooks/use-compare-page";
import { useCompareWebMcpTools } from "./_components/webmcp/use-compare-webmcp-tools";

const ComparePage = () => {
  const pageData = useComparePage();
  // For a browser agent (WebMCP), where the browser offers it; nothing otherwise.
  useCompareWebMcpTools();

  return <ComparePresenter {...pageData} />;
};

export default ComparePage;
