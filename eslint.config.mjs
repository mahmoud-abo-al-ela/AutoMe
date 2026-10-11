import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

// Only lib/repositories touches the database. Everything else reaches data
// through a repository, so the Prisma client and the generated client's runtime
// values (the `Prisma` namespace, enum objects) are off limits outside it.
// `import type` stays allowed everywhere: model and enum types cost nothing at
// runtime and are how the rest of the app names the data's shape.
const PRISMA_BOUNDARY = {
  paths: [
    {
      name: "@/lib/prisma",
      message: "Only lib/repositories/** may use the Prisma client. Add or reuse a repository function.",
    },
    {
      name: "@/lib/generated/prisma",
      allowTypeImports: true,
      message: "Outside lib/repositories/**, import Prisma types only: `import type { … }`.",
    },
    {
      name: "@prisma/client",
      allowTypeImports: true,
      message: "Use the generated client (@/lib/generated/prisma), and only in lib/repositories/**.",
    },
  ],
  patterns: [
    {
      group: ["@/lib/generated/prisma/*"],
      allowTypeImports: true,
      message: "Outside lib/repositories/**, import Prisma types only: `import type { … }`.",
    },
  ],
};

// Files that already used the Prisma client outside lib/repositories when the
// boundary was introduced (2026-10-11). They report as warnings so lint stays
// green while each is moved; every new file is held to the rule as an error.
// Remove a line when its queries move into a repository. Never add one.
const KNOWN_PRISMA_VIOLATIONS = [
  "actions/onboarding.ts",
  "actions/stream-chat.ts",
  "actions/super-admin/organizations.ts",
  "actions/super-admin/plans.ts",
  "actions/super-admin/users.ts",
  "actions/team.ts",
  "actions/test-drive.ts",
  "app/[[]locale]/org/[[]slug]/billing/page.tsx",
  "app/api/super-admin/organizations/[[]id]/members/route.ts",
  "app/api/webhooks/clerk/route.ts",
  "lib/checkUser.ts",
  "lib/org/access.ts",
  "lib/org/resolve.ts",
  "lib/services/dealership/users.ts",
];

// The layers' import direction: app → actions → services → repositories, never
// back. Expressed with no-restricted-syntax (a rule separate from the Prisma
// boundary's, so the two legacy lists cannot override each other) and limited
// to runtime imports — `import type` crosses layers freely, at no cost.
// (esquery regexes cannot contain "/", so "." stands in for the path separator.)
const runtimeImportOf = (pattern, message) => ({
  selector: `ImportDeclaration[importKind!='type'][source.value=${pattern}]`,
  message,
});
const LAYER = {
  repositories: (who) =>
    runtimeImportOf(
      "/^@.lib.repositories(.|$)/",
      `${who} reach data through a service (lib/services), not a repository.`
    ),
  serverOnly: runtimeImportOf(
    "/^@.lib.(ai|jobs)(.|$)/",
    "UI does not call models or queue jobs: go through an action and a lib/services use-case."
  ),
  ui: runtimeImportOf(
    "/^@.(app|actions|components|hooks)(.|$)/",
    "lib/ never depends on pages, actions or UI: move the shared piece into lib/."
  ),
  services: runtimeImportOf(
    "/^@.lib.services(.|$)/",
    "Repositories never call services: the service calls the repository."
  ),
};

// Files that already crossed a layer when the direction was enforced
// (2026-10-11), reported as warnings. Remove a line when the file goes through
// a service; never add one.
const KNOWN_LAYER_VIOLATIONS = {
  entryPoints: [
    "actions/billing.ts",
    "actions/buyer-questions.ts",
    "actions/cars-listing.ts",
    "actions/home.ts",
    "actions/onboarding.ts",
    "actions/test-drive.ts",
    "app/api/cron/backfill-image-alts/route.ts",
    "app/api/cron/backfill-question-embeddings/route.ts",
    "app/api/webhooks/clerk/route.ts",
  ],
};

const UI_FILES = ["app/**", "components/**", "hooks/**"];
const ENTRY_POINT_FILES = ["actions/**", "app/api/**"];
const UI_LAYER = [LAYER.repositories("Pages and components"), LAYER.serverOnly];
const ENTRY_POINT_LAYER = [LAYER.repositories("Actions and route handlers")];

// A review trigger, not a limit: past this many lines of code a file usually
// holds more than one responsibility. Split by responsibility (see the
// code-craft skill), never just to get under the number.
const MAX_LINES = { max: 300, skipBlankLines: true, skipComments: true };

const eslintConfig = [
  {
    // Build output and generated code are not ours to lint.
    ignores: [
      ".next/**",
      "node_modules/**",
      "lib/generated/**",
      "public/**",
      "next-env.d.ts",
    ],
  },
  ...compat.extends("next/core-web-vitals"),
  {
    rules: {
      "no-restricted-imports": ["error", PRISMA_BOUNDARY],
      "max-lines": ["warn", MAX_LINES],
    },
  },
  {
    // The data layer itself; tests and data tooling that seed or inspect a
    // real database directly.
    files: [
      "lib/repositories/**",
      "lib/prisma.ts",
      "prisma.config.ts",
      "prisma/**",
      "scripts/**",
      "test/**",
      "**/*.test.{js,jsx,ts,tsx}",
    ],
    rules: { "no-restricted-imports": "off" },
  },
  {
    files: KNOWN_PRISMA_VIOLATIONS,
    rules: { "no-restricted-imports": ["warn", PRISMA_BOUNDARY] },
  },
  {
    files: UI_FILES,
    ignores: ENTRY_POINT_FILES,
    rules: { "no-restricted-syntax": ["error", ...UI_LAYER] },
  },
  {
    files: ENTRY_POINT_FILES,
    rules: { "no-restricted-syntax": ["error", ...ENTRY_POINT_LAYER] },
  },
  {
    files: ["lib/**"],
    rules: { "no-restricted-syntax": ["error", LAYER.ui] },
  },
  {
    files: ["lib/repositories/**"],
    rules: { "no-restricted-syntax": ["error", LAYER.ui, LAYER.services] },
  },
  {
    files: KNOWN_LAYER_VIOLATIONS.entryPoints,
    rules: { "no-restricted-syntax": ["warn", ...ENTRY_POINT_LAYER] },
  },
  {
    // Tests reach into any layer to set up and assert.
    files: ["test/**", "**/*.test.{js,jsx,ts,tsx}"],
    rules: { "no-restricted-syntax": "off" },
  },
  {
    // Vendored shadcn primitives, test data and seed data are long by nature.
    files: [
      "components/ui/**",
      "prisma/seed.ts",
      "test/**",
      "**/*.test.{js,jsx,ts,tsx}",
      "**/*.fixtures.{js,ts}",
    ],
    rules: { "max-lines": "off" },
  },
];

export default eslintConfig;
