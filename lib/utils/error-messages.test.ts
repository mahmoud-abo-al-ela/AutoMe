import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  NotFoundError,
  PlanLimitError,
  RateLimitError,
  ServiceUnavailableError,
  ValidationError,
} from "./errors";
import { createErrorResponse } from "./response";

/**
 * The contract these pin: a thrown AppError names its user-facing text with a
 * key, and that key survives into the response envelope the client reads.
 *
 * Both halves fail silently otherwise. A class that forgets its key still
 * throws, still returns an envelope and still renders — just in English, for
 * every reader, and only on the error path where nobody looks.
 */
describe("errors carry a message key", () => {
  const cases: Array<[string, { messageKey?: string }]> = [
    ["AuthenticationError", new AuthenticationError()],
    ["AuthorizationError", new AuthorizationError()],
    ["NotFoundError", new NotFoundError("Car")],
    ["ConflictError", new ConflictError()],
    ["RateLimitError", new RateLimitError()],
    ["ServiceUnavailableError", new ServiceUnavailableError()],
    ["PlanLimitError", new PlanLimitError({ resource: "cars" })],
  ];

  for (const [name, error] of cases) {
    it(`${name} sets one`, () => {
      expect(error.messageKey).toBeTruthy();
    });
  }

  it("ValidationError deliberately does not", () => {
    // Its wording is field-specific, so a generic key would lose the only
    // useful part. Sites that need one pass it explicitly.
    expect(new ValidationError("Car ID is required").messageKey).toBeUndefined();
    expect(
      new ValidationError("x", null, { key: "errors.custom" }).messageKey
    ).toBe("errors.custom");
  });

  it("passes the resource as a param rather than baking it into the key", () => {
    const error = new NotFoundError("Test drive");

    expect(error.messageKey).toBe("errors.notFound");
    expect(error.messageParams).toEqual({ resource: "Test drive" });
    // The English message stays as the developer-facing fallback.
    expect(error.message).toBe("Test drive not found");
  });
});

describe("createErrorResponse", () => {
  it("carries the key and params to the client", () => {
    const response = createErrorResponse(new NotFoundError("Car"));

    expect(response.success).toBe(false);
    expect(response.error.messageKey).toBe("errors.notFound");
    expect(response.error.messageParams).toEqual({ resource: "Car" });
  });

  it("omits them for anything thrown outside the hierarchy", () => {
    const response = createErrorResponse(new Error("boom"));

    expect(response.error.messageKey).toBeUndefined();
    // message is all the client has left, which is why the resolver falls
    // back to it rather than to a generic apology.
    expect(response.error.message).toBe("boom");
  });
});

describe("the errors namespace", () => {
  const read = (locale: string) =>
    JSON.parse(
      fs.readFileSync(
        path.join(process.cwd(), "messages", locale, "errors.json"),
        "utf8"
      )
    ) as Record<string, unknown>;

  const en = read("en");
  const ar = read("ar");

  it("defines every key the error classes emit", () => {
    const emitted = [
      new AuthenticationError(),
      new AuthorizationError(),
      new NotFoundError(),
      new ConflictError(),
      new RateLimitError(),
      new ServiceUnavailableError(),
      new PlanLimitError({ resource: "cars" }),
    ].map((e) => e.messageKey!.replace(/^errors\./, ""));

    for (const key of emitted) {
      expect(en, `en is missing ${key}`).toHaveProperty(key);
      expect(ar, `ar is missing ${key}`).toHaveProperty(key);
    }
  });

  it("is at en/ar parity", () => {
    const flat = (o: Record<string, unknown>, p = ""): string[] =>
      Object.entries(o).flatMap(([k, v]) =>
        v && typeof v === "object"
          ? flat(v as Record<string, unknown>, `${p}${k}.`)
          : [`${p}${k}`]
      );

    expect(flat(ar).sort()).toEqual(flat(en).sort());
  });

  it("translates the resource nouns the throw sites actually use", () => {
    // NotFoundError is constructed with an English noun; the resolver looks it
    // up under resources and passes it through when absent. A miss is not a
    // crash, so only a test catches it.
    const resources = en.resources as Record<string, string>;
    for (const noun of ["Car", "Organization", "Test drive", "User"]) {
      expect(resources, `no Arabic for "${noun}"`).toHaveProperty(noun);
    }
  });
});
