import { afterEach, describe, expect, it, vi } from "vitest";
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
import { createErrorResponse, UNEXPECTED_ERROR_CODE } from "./response";
import { resolveActionError, type ErrorTranslator } from "./error-messages";
import { BOOKING_PROBLEMS } from "./booking-slots";

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

  it("withholds the message and code of anything thrown outside the hierarchy", () => {
    // What a failed Prisma write looks like: the query, the column, and
    // Prisma's own error code. None of it is for the browser.
    const prismaLike = Object.assign(
      new Error(
        "Invalid `prisma.car.create()` invocation: Unique constraint failed on the fields: (`vin`)"
      ),
      { code: "P2002" }
    );
    const response = createErrorResponse(prismaLike);

    expect(response.error.code).toBe(UNEXPECTED_ERROR_CODE);
    expect(response.error.message).toBe("An unexpected error occurred");
    expect(JSON.stringify(response)).not.toMatch(/prisma|vin|P2002/);
    expect(response.error.messageKey).toBeUndefined();
  });

  it("withholds a thrown non-Error too", () => {
    expect(createErrorResponse("boom").error.message).toBe(
      "An unexpected error occurred"
    );
    expect(createErrorResponse(undefined).error.code).toBe(UNEXPECTED_ERROR_CODE);
  });

  it("keeps an AppError's message, which was written to be read", () => {
    const response = createErrorResponse(
      new ConflictError("An organization with this slug already exists")
    );

    expect(response.error.message).toBe(
      "An organization with this slug already exists"
    );
    expect(response.error.code).toBe("CONFLICT");
  });

  describe("in development", () => {
    afterEach(() => vi.unstubAllEnvs());

    it("keeps the real message for whoever is debugging", () => {
      vi.stubEnv("NODE_ENV", "development");
      const response = createErrorResponse(new Error("boom"));

      expect(response.error.message).toBe("boom");
      // Still flagged unexpected, so the page shows the same text it will in
      // production — a dev never sees a message no reader would.
      expect(response.error.code).toBe(UNEXPECTED_ERROR_CODE);
    });
  });
});

describe("resolveActionError", () => {
  const messages: Record<string, string> = {
    generic: "Something went wrong.",
    notFound: "{resource} could not be found.",
    "resources.Car": "The car",
  };
  const t = Object.assign(
    (key: string, params?: Record<string, unknown>) =>
      messages[key].replace(/\{(\w+)\}/g, (_, k) => String(params?.[k])),
    { has: (key: string) => key in messages }
  ) as ErrorTranslator;

  it("translates the key, with its resource noun", () => {
    expect(
      resolveActionError(t, createErrorResponse(new NotFoundError("Car")).error)
    ).toBe("The car could not be found.");
  });

  it("shows the caller's fallback for an unexpected error, not server text", () => {
    const error = createErrorResponse(new Error("connect ECONNREFUSED")).error;

    expect(resolveActionError(t, error, "Couldn’t update wishlist")).toBe(
      "Couldn’t update wishlist"
    );
    expect(resolveActionError(t, error)).toBe("Something went wrong.");
  });

  it("formats numeric params in the reader's numerals", () => {
    messages["upload.tooMany"] = "You can add at most {max} images.";
    const error = createErrorResponse(
      new ValidationError("Maximum of 10 images allowed", "images", {
        key: "errors.upload.tooMany",
        params: { max: 10 },
      })
    ).error;
    const arabicDigits = (n: number) => new Intl.NumberFormat("ar-EG").format(n);

    expect(resolveActionError(t, error, undefined, arabicDigits)).toBe(
      "You can add at most ١٠ images."
    );
    // Without a formatter the raw number still interpolates.
    expect(resolveActionError(t, error)).toBe("You can add at most 10 images.");
  });

  it("still prefers a keyless AppError's message to the fallback", () => {
    // Written for a reader, so English beats a vaguer translation until the
    // throw site gets a key.
    const error = createErrorResponse(new ValidationError("Price must be positive")).error;

    expect(resolveActionError(t, error, "Couldn’t save")).toBe("Price must be positive");
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

  it("defines every key a throw site names, in both locales", () => {
    // A key no message file defines still throws and still returns — and then
    // resolves to the English `message`, silently. Scan the source for them.
    const walk = (dir: string): string[] =>
      fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) return walk(full);
        return /\.(ts|js)$/.test(entry.name) && !/\.test\./.test(entry.name) ? [full] : [];
      });
    const sources = ["actions", "lib/services", "lib/middleware", "lib/repositories"]
      .flatMap((dir) => walk(path.join(process.cwd(), dir)));

    const keys = new Set<string>();
    for (const file of sources) {
      for (const match of fs.readFileSync(file, "utf8").matchAll(/key: "errors\.([\w.]+)"/g)) {
        keys.add(match[1]);
      }
    }
    expect(keys.size).toBeGreaterThan(10);

    const has = (messages: Record<string, unknown>, key: string) =>
      key.split(".").reduce<unknown>(
        (node, part) => (node && typeof node === "object" ? (node as Record<string, unknown>)[part] : undefined),
        messages
      );
    for (const key of keys) {
      expect(has(en, key), `en is missing errors.${key}`).toEqual(expect.any(String));
      expect(has(ar, key), `ar is missing errors.${key}`).toEqual(expect.any(String));
    }
  });

  it("has a message for every reason a test-drive slot is refused", () => {
    // The booking service builds these keys from the reason, so the source
    // scan above cannot see them.
    for (const problem of BOOKING_PROBLEMS) {
      for (const [locale, messages] of [["en", en], ["ar", ar]] as const) {
        const slot = (messages.testDrive as { slot?: Record<string, string> }).slot;
        expect(slot?.[problem], `${locale} lacks testDrive.slot.${problem}`).toEqual(expect.any(String));
      }
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
