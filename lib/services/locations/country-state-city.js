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

async function fetchLocationResource(path) {
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

export async function getCountries() {
  const countries = await fetchLocationResource("/countries");

  return countries
    .map((country) => ({
      code: country.iso2,
      name: country.name,
      emoji: country.emoji,
    }))
    .filter((country) => country.code && country.name)
    .sort((firstCountry, secondCountry) => firstCountry.name.localeCompare(secondCountry.name));
}

export async function getStates(countryCode) {
  if (!countryCode) return [];

  const states = await fetchLocationResource(`/countries/${countryCode}/states`);

  return states
    .map((state) => ({
      code: state.iso2,
      name: state.name,
    }))
    .filter((state) => state.code && state.name)
    .sort((firstState, secondState) => firstState.name.localeCompare(secondState.name));
}

export async function getCities(countryCode, stateCode) {
  if (!countryCode || !stateCode) return [];

  const cities = await fetchLocationResource(
    `/countries/${countryCode}/states/${stateCode}/cities`
  );

  return cities
    .map((city) => ({
      id: city.id,
      name: city.name,
    }))
    .filter((city) => city.name)
    .sort((firstCity, secondCity) => firstCity.name.localeCompare(secondCity.name));
}
