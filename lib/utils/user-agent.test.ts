import { describe, expect, it } from "vitest";
import { describeUserAgent } from "./user-agent";

describe("describeUserAgent", () => {
  it("names the browser and the system", () => {
    expect(
      describeUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36"),
    ).toEqual({ browser: "Chrome", system: "Windows" });
    expect(
      describeUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"),
    ).toEqual({ browser: "Safari", system: "iPhone" });
    expect(
      describeUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 Edg/129.0.0.0"),
    ).toEqual({ browser: "Edge", system: "Windows" });
    expect(describeUserAgent("Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0.0.0 Mobile Safari/537.36")).toEqual({
      browser: "Samsung Internet",
      system: "Android",
    });
  });

  it("says nothing when it can't tell", () => {
    expect(describeUserAgent(null)).toBeNull();
    expect(describeUserAgent("node-fetch/1.0")).toBeNull();
  });
});
