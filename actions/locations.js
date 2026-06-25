"use server";

import { withErrorHandling } from "@/lib/middleware/with-auth";
import { createSuccessResponse } from "@/lib/utils/response";
import * as locationService from "@/lib/services/locations/country-state-city";

export const getCountries = withErrorHandling(async () => {
  const countries = await locationService.getCountries();
  return createSuccessResponse(countries);
});

export const getStates = withErrorHandling(async (countryCode) => {
  const states = await locationService.getStates(countryCode);
  return createSuccessResponse(states);
});

export const getCities = withErrorHandling(async (countryCode, stateCode) => {
  const cities = await locationService.getCities(countryCode, stateCode);
  return createSuccessResponse(cities);
});
