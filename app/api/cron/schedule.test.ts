import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const cronDir = join(process.cwd(), "app/api/cron");
const scheduled = new Set(
  (JSON.parse(readFileSync(join(process.cwd(), "vercel.json"), "utf8")).crons as { path: string }[]).map(
    ({ path }) => path.split("?")[0]
  )
);

describe("vercel.json crons", () => {
  const routes = readdirSync(cronDir, { withFileTypes: true }).filter((entry) => entry.isDirectory());

  it.each(routes.map((entry) => entry.name))("schedules /api/cron/%s when it answers GET", (name) => {
    const source = readFileSync(join(cronDir, name, "route.ts"), "utf8");
    if (!/export async function GET\(/.test(source)) return;
    expect(scheduled).toContain(`/api/cron/${name}`);
  });

  it("schedules nothing that does not exist", () => {
    const names = new Set(routes.map((entry) => `/api/cron/${entry.name}`));
    for (const path of scheduled) expect(names).toContain(path);
  });
});
