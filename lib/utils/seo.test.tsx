import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { StructuredData } from "./seo";

describe("StructuredData", () => {
  it("cannot be closed early by text inside it", () => {
    const html = renderToStaticMarkup(
      <StructuredData data={{ description: "Best cars</script><script>alert(1)</script>" }} />
    );
    // One script element, whatever the dealer wrote.
    expect(html.match(/<\/script>/g)).toHaveLength(1);
    const json = html.replace(/^<script[^>]*>/, "").replace(/<\/script>$/, "");
    expect(JSON.parse(json).description).toBe("Best cars</script><script>alert(1)</script>");
  });

  it("renders nothing without data", () => {
    expect(renderToStaticMarkup(<StructuredData data={null} />)).toBe("");
  });
});
