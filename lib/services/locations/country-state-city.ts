import { AuthenticationError, RateLimitError, ValidationError } from "@/lib/utils/errors";

const API_BASE_URL = "https://api.countrystatecity.in/v1";
const LOCATION_CACHE_SECONDS = 60 * 60 * 24;

function getApiKey() {
  const apiKey = process.env.COUNTRYSTATECITY_API_KEY || process.env.CSC_API_KEY;
  if (!apiKey) {
    throw new AuthenticationError(
      "Country State City API key is not configured. Set COUNTRYSTATECITY_API_KEY or CSC_API_KEY."
    );
  }
  return apiKey;
}

/** The shape of an api.countrystatecity.in row — every field is optional. */
interface LocationApiRow {
  id?: number;
  iso2?: string | null;
  name?: string | null;
  emoji?: string | null;
}

export interface CountryOption {
  code: string;
  name: string;
  emoji?: string | null;
}

export interface StateOption {
  code: string;
  name: string;
}

export interface CityOption {
  id?: number;
  name: string;
}

async function fetchLocationResource(path: string): Promise<LocationApiRow[]> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "X-CSCAPI-KEY": getApiKey(),
    },
    next: { revalidate: LOCATION_CACHE_SECONDS },
  });

  if (response.status === 401) {
    throw new AuthenticationError("Country State City API key is invalid");
  }

  if (response.status === 429) {
    throw new RateLimitError("Country State City API rate limit exceeded");
  }

  if (!response.ok) {
    throw new ValidationError("Failed to fetch location options", "location");
  }

  return response.json();
}

// The API omits fields on some rows, so each list drops incomplete entries.
// Written as type predicates so the sort below sees non-null names.
const hasCodeAndName = <T extends { code?: string | null; name?: string | null }>(
  row: T
): row is T & { code: string; name: string } => Boolean(row.code && row.name);

const hasName = <T extends { name?: string | null }>(
  row: T
): row is T & { name: string } => Boolean(row.name);

export async function getCountries(): Promise<CountryOption[]> {
  const countries = await fetchLocationResource("/countries");

  return countries
    .map((country) => ({
      code: country.iso2,
      name: country.name,
      emoji: country.emoji,
    }))
    .filter(hasCodeAndName)
    .sort((firstCountry, secondCountry) => firstCountry.name.localeCompare(secondCountry.name));
}

export async function getStates(
  countryCode: string | null | undefined
): Promise<StateOption[]> {
  if (!countryCode) return [];

  const states = await fetchLocationResource(`/countries/${countryCode}/states`);

  return states
    .map((state) => ({
      code: state.iso2,
      name: state.name,
    }))
    .filter(hasCodeAndName)
    .sort((firstState, secondState) => firstState.name.localeCompare(secondState.name));
}

export async function getCities(
  countryCode: string | null | undefined,
  stateCode: string | null | undefined
): Promise<CityOption[]> {
  if (!countryCode || !stateCode) return [];

  const cities = await fetchLocationResource(
    `/countries/${countryCode}/states/${stateCode}/cities`
  );

  return cities
    .map((city) => ({
      id: city.id,
      name: city.name,
    }))
    .filter(hasName)
    .sort((firstCity, secondCity) => firstCity.name.localeCompare(secondCity.name));
}
