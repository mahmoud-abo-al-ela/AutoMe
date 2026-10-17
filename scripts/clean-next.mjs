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
