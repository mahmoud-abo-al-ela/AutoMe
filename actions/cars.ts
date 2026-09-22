"use server";
import { withOrgAuth } from "@/lib/middleware/with-auth";
import { revalidatePath } from "next/cache";
import * as carService from "@/lib/services/car";
import { extractCarListing } from "@/lib/services/ai";
import { createSuccessResponse } from "@/lib/utils/response";
import { NotFoundError, AuthorizationError } from "@/lib/utils/errors";
import { validateAction } from "@/lib/middleware/with-validation";
import { carSchema, updateCarSchema, updateCarFullSchema } from "@/lib/validations/schemas";
import { enforceRateLimit } from "@/lib/middleware/with-rate-limit";
import { withPlanGate } from "@/lib/middleware/with-plan-gate";
import { withUsageLimit } from "@/lib/middleware/with-usage-limit";


/**
 * Extract a car listing from a dealer's photo.
 *
 * Gated before it spends: the plan must enable AI, the quota must have room,
 * and only then is the request rate-limited and sent. Prompt, schema, metering
 * and caching live in lib/services/ai, so this stays what an action should be —
 * guards plus a delegation.
 *
 * There is deliberately no ungated export beside it. The previous
 * `processCarImageWithAI` was exported from this "use server" module, which
 * makes it a callable RPC endpoint in its own right: a client could invoke it
 * directly and skip withOrgAuth, withPlanGate and withUsageLimit entirely.
 */
export const processCarImageGated = withOrgAuth(
  withPlanGate(
    "aiProcessing",
    withUsageLimit("aiProcessing", async (ctx, file: File) => {
      await enforceRateLimit();

      const draft = await extractCarListing(file, {
        organizationId: ctx.organization.id,
        userId: ctx.userId,
      });

      return createSuccessResponse(draft);
    })
  )
);


export const getCarPlanLimits = withOrgAuth(async (ctx) => {
  const plan = ctx.organization.subscription?.plan;
  const maxImages = plan?.maxImagesPerCar ?? 5;
  // Plan.features is free-form JSON; narrow before reading the AI entitlement.
  const features = (plan?.features ?? {}) as {
    aiProcessing?: { enabled?: boolean };
  };
  const aiProcessingEnabled = features.aiProcessing?.enabled ?? false;

  return createSuccessResponse({
    maxImagesPerCar: maxImages,
    aiProcessingEnabled,
  });
});

// Backward-compatible alias
export async function getMaxImagesPerCar() {
  return getCarPlanLimits();
}

export const addCar = withOrgAuth(
  withUsageLimit("cars", async (ctx, payload: { data?: unknown } & Record<string, unknown>) => {
    const rawData = payload.data || payload;
    const carData = validateAction(carSchema, rawData);
    const car = await carService.createCar(carData, ctx.userId, ctx.organization.id);

    revalidatePath(`/org/${ctx.organization.slug}/cars`);
    return createSuccessResponse(car, "Car added successfully");
  })
);

export const getCars = withOrgAuth(
  async (
    ctx,
    search: string = "",
    status: string = "all",
    page: number = 1,
    limit: number = 10
  ) => {
  const filters = {
    search: search || undefined,
    status: status === "all" ? undefined : status.toUpperCase(),
    onlyAvailable: false,
  };

  const result = await carService.getCars(filters, { page, limit }, ctx.userId, ctx.organization.id);

  return createSuccessResponse({
    data: result.cars,
    pagination: result.pagination,
  });
});

export const deleteCar = withOrgAuth(async (ctx, carId: string) => {
  await carService.deleteCar(carId, ctx.userId, ctx.organization.id);

  revalidatePath(`/org/${ctx.organization.slug}/cars`);
  return createSuccessResponse(null, "Car deleted successfully");
});

export const updateCar = withOrgAuth(
  async (
    ctx,
    carId: string,
    { status, featured }: { status?: string; featured?: boolean }
  ) => {
  const updateData: { status?: string; featured?: boolean } = {};
  if (status !== undefined) updateData.status = status;
  if (featured !== undefined) updateData.featured = featured;

  const validatedUpdate = validateAction(updateCarSchema, updateData);

  const updatedCar = await carService.updateCar(carId, validatedUpdate, ctx.userId, ctx.organization.id);

  revalidatePath(`/org/${ctx.organization.slug}/cars`);
  return createSuccessResponse(updatedCar, "Car updated successfully");
});

export const getCarForEdit = withOrgAuth(async (ctx, carId: string) => {
  const car = await carService.getCarById(carId);
  if (!car) {
    throw new NotFoundError("Car");
  }
  // Verify car belongs to user's organization
  // Platform admins (UserRole.ADMIN) may reach across orgs for support; regular
  // members may not. `ctx.role` never existed, and MemberRole has no ADMIN value,
  // so the escape hatch has to read the platform role off ctx.user.
  if (car.organizationId !== ctx.organization.id && ctx.user?.role !== "ADMIN") {
    throw new AuthorizationError("You don't have access to this car");
  }
  return createSuccessResponse(car);
});

export const updateCarFull = withOrgAuth(
  async (
    ctx,
    carId: string,
    payload: { data?: unknown } & Record<string, unknown>
  ) => {
  const rawData = payload.data || payload;
  const carData = validateAction(updateCarFullSchema, rawData);

  const updatedCar = await carService.updateCarFull(
    carId,
    carData,
    ctx.userId,
    ctx.organization.id
  );

  revalidatePath(`/org/${ctx.organization.slug}/cars`);
  return createSuccessResponse(updatedCar, "Car updated successfully");
});
