// Clears build output from `.next` before `next build`, keeping `.next/cache`.
//
// Why: `next dev` and `next build` share `.next`. Dev writes
// `server/pages-manifest.json` listing the framework's built-in pages-router
// shims (`/_document`, `/_app`, `/_error`) but does not emit the corresponding
// `server/pages/*.js` that a production build does. Running `next build` over
// a dev-populated `.next` therefore reaches "Collecting page data" with a
// manifest pointing at modules that were never written, and fails with
//
//   PageNotFoundError: Cannot find module for page: /_document
//
// which is confusing because this project is App Router only and has no
// `pages/` directory. The manifest entry is normal and expected — a clean
// production build emits it too, alongside the artifacts it names.
//
// `cache/` is preserved deliberately: it is webpack's content-addressed cache,
// not build output, so it cannot carry a stale manifest but does keep rebuilds
// from starting cold.

import { readdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";

const NEXT_DIR = ".next";
const KEEP = new Set(["cache"]);

if (!existsSync(NEXT_DIR)) {
  process.exit(0);
}

for (const entry of readdirSync(NEXT_DIR)) {
  if (KEEP.has(entry)) continue;
  rmSync(join(NEXT_DIR, entry), { recursive: true, force: true });
}
