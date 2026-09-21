import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import enOrg from "@/messages/en/org.json";
import arOrg from "@/messages/ar/org.json";

/**
 * The audit table renders database enum members: the stored token stays
 * English and only the label is translated, keyed by the token itself.
 *
 * Both enums are read out of `schema.prisma` rather than restated here, and
 * rather than imported from the generated client — importing that would drag
 * the Prisma runtime into a message test. A member added to the schema
 * without a label then fails here, instead of showing a dealer a raw
 * `org.auditLogs.actions.…` key in a badge nobody on this side ever looks at.
 */

const schema = readFileSync(
  path.join(process.cwd(), "prisma", "schema.prisma"),
  "utf8"
);

const enumMembers = (name: string): string[] => {
  const block = schema.match(new RegExp(`enum ${name} \\{([^}]*)\\}`));
  if (!block) throw new Error(`enum ${name} not found in schema.prisma`);

  return block[1]
    .split(/\r?\n/)
    .map((line) => line.split("//")[0].trim())
    .filter(Boolean);
};

const AUDIT_ACTIONS = enumMembers("AuditAction");
const ENTITY_TYPES = enumMembers("EntityType");

describe("audit log messages", () => {
  it("reads both enums out of the schema", () => {
    // Guards the parser itself: an empty list would make every check below
    // pass without asserting anything.
    expect(AUDIT_ACTIONS.length).toBeGreaterThan(20);
    expect(ENTITY_TYPES.length).toBeGreaterThan(5);
  });

  it.each(["en", "ar"] as const)("labels every audit action in %s", (locale) => {
    const messages = locale === "en" ? enOrg : arOrg;

    for (const action of AUDIT_ACTIONS) {
      expect(
        messages.auditLogs.actions[action as keyof typeof messages.auditLogs.actions],
        `missing org.auditLogs.actions.${action}`
      ).toBeTruthy();
    }
  });

  it.each(["en", "ar"] as const)("labels every entity type in %s", (locale) => {
    const messages = locale === "en" ? enOrg : arOrg;

    for (const entityType of ENTITY_TYPES) {
      expect(
        messages.auditLogs.entities[
          entityType as keyof typeof messages.auditLogs.entities
        ],
        `missing org.auditLogs.entities.${entityType}`
      ).toBeTruthy();
    }
  });

  it("labels nothing the schema does not define", () => {
    // The other direction: a label left behind by a renamed enum member is
    // dead copy that a translator keeps maintaining.
    expect(Object.keys(enOrg.auditLogs.actions).sort()).toEqual(
      [...AUDIT_ACTIONS].sort()
    );
    expect(Object.keys(enOrg.auditLogs.entities).sort()).toEqual(
      [...ENTITY_TYPES].sort()
    );
  });
});
