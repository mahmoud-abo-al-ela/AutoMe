"use server";
import { withOrgAuth } from "@/lib/middleware/with-auth";
import * as dashboardService from "@/lib/services/dashboard";
import { createSuccessResponse } from "@/lib/utils/response";
import { validateAction } from "@/lib/middleware/with-validation";
import { dealContextSchema, insightsSchema, scheduleDaySchema, scheduleMonthSchema } from "@/lib/validations/schemas";
import * as dealService from "@/lib/services/dashboard/deal";
import * as scheduleService from "@/lib/services/dashboard/schedule";

export const getTestDriveTrendsData = withOrgAuth(async (ctx) => {
  const days = 30; // default to 30 days, could be passed in payload
  const trends = await dashboardService.getTestDriveTrendsData(ctx.userId, ctx.organization.id, days);
  return createSuccessResponse(trends);
});

export const getTodayBoard = withOrgAuth(async (ctx) => {
  const board = await dashboardService.getTodayBoard(ctx.userId, ctx.organization.id);
  return createSuccessResponse({ ...board, organizationName: ctx.organization.name });
});

export const getInsights = withOrgAuth(async (ctx, input: unknown) => {
  const { days } = validateAction(insightsSchema, input);
  const insights = await dashboardService.getInsights(ctx.userId, ctx.organization.id, days);
  return createSuccessResponse(insights);
});

export const getCarsNeedingAttention = withOrgAuth(async (ctx) => {
  const cars = await dashboardService.getCarsNeedingAttention(ctx.userId, ctx.organization.id);
  return createSuccessResponse(cars);
});

/** The Test drives calendar's month: drives per day, and the weekdays it is closed. */
export const getScheduleMonth = withOrgAuth(async (ctx, input: unknown) => {
  const { month } = validateAction(scheduleMonthSchema, input);
  return createSuccessResponse(await scheduleService.getScheduleMonth(ctx.userId, ctx.organization.id, month));
});

/** One day of the calendar: its hours, its drives and the free time between them. */
export const getScheduleDay = withOrgAuth(async (ctx, input: unknown) => {
  const { date } = validateAction(scheduleDaySchema, input);
  return createSuccessResponse(await scheduleService.getScheduleDay(ctx.userId, ctx.organization.id, date));
});

/** Confirmed drives whose time has passed with no outcome recorded. */
export const getDrivesNeedingOutcome = withOrgAuth(async (ctx) => {
  return createSuccessResponse(await scheduleService.getDrivesNeedingOutcome(ctx.userId, ctx.organization.id));
});

/** The deal beside a conversation in Messages: the car, its market position, and the buyer's history here. */
export const getDealContext = withOrgAuth(async (ctx, input: unknown) => {
  const { buyerId, carId } = validateAction(dealContextSchema, input);
  return createSuccessResponse(await dealService.getDealContext(ctx.userId, ctx.organization.id, { buyerId, carId }));
});
