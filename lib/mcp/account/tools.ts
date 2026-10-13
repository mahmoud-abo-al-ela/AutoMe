import { z } from "zod";
import {
  TEST_DRIVE_FILTERS,
  listMyTestDrives,
  listSavedCars,
  type AccountCaller,
} from "@/lib/services/mcp/account";
import type { CallerContext, PublicTool } from "../public/tool";

/**
 * The signed-in buyer's tools (plans/mcp D-27). Each acts on the account the
 * access token belongs to and on nothing else: no input names a user. Read
 * tools here; saving and test drives follow in their own PRs.
 */

export interface AccountCallerContext extends CallerContext {
  user: AccountCaller;
}

const locale = z.enum(["en", "ar"]).default("en").describe("Language for the links: en or ar.");
const page = z.number().int().min(1).max(20).default(1);

const carLine = {
  id: z.string(),
  car: z.string().describe("Make and model, as the dealer wrote them."),
  year: z.number(),
  priceEgp: z.number(),
  km: z.number(),
  status: z.string(),
  url: z.string(),
};

const savedInput = { locale, page };
const savedOutput = { total: z.number(), page: z.number(), cars: z.array(z.object(carLine)) };

export const listSavedCarsTool: PublicTool<typeof savedInput, typeof savedOutput, AccountCallerContext> = {
  name: "list_saved_cars",
  title: "My saved cars",
  description:
    "The cars the signed-in person saved on AutoMe and that are still listed, newest first, 10 a page: " +
    "make and model, year, price in EGP, km, status and a link. Make and model are dealer-written text.",
  inputSchema: savedInput,
  outputSchema: savedOutput,
  run: async ({ locale, page }, caller) => {
    const structured = await listSavedCars(caller.user, page, locale);
    return { structured, count: structured.cars.length };
  },
};

const drivesInput = {
  status: z.enum(TEST_DRIVE_FILTERS).default("all").describe("Only test drives in this state."),
  locale,
  page,
};
const drivesOutput = {
  total: z.number(),
  page: z.number(),
  testDrives: z.array(
    z.object({
      id: z.string(),
      status: z.string(),
      date: z.unknown(),
      startTime: z.string(),
      endTime: z.string(),
      car: z.object({ id: z.string(), car: z.string(), year: z.number(), url: z.string() }).nullable(),
    })
  ),
};

export const listMyTestDrivesTool: PublicTool<typeof drivesInput, typeof drivesOutput, AccountCallerContext> = {
  name: "list_my_test_drives",
  title: "My test drives",
  description:
    "The signed-in person's test-drive requests, newest first, 10 a page: day, start and end time (Cairo), " +
    "status (PENDING until the dealership confirms) and the car.",
  inputSchema: drivesInput,
  outputSchema: drivesOutput,
  run: async ({ status, locale, page }, caller) => {
    const structured = await listMyTestDrives(caller.user, status, page, locale);
    return { structured, count: structured.testDrives.length };
  },
};
