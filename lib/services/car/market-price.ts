// How a listing's price sits among comparable listings on AutoMe.
import * as carRepository from "@/lib/repositories/car";
import {
  COMPARISONS,
  comparisonFor,
  summarizeMarketPrices,
  type MarketPrices,
} from "@/lib/ai/grounding";
import { logError } from "@/lib/utils/errors";

/**
 * The comparison is the listing assistant's (lib/ai/grounding): the same
 * ladder of comparables, the same median, the same minimum count. The fair-
 * price gauge on the site and the assistant's "how does the price compare?"
 * answer therefore can never disagree about one car.
 */

interface PricedCar {
  id: string;
  make: string;
  model: string;
  bodyType: string;
  year: number;
  price: number;
  priceCurrency: string;
}

/** What a card or listing page needs: where the price sits, and on how much evidence. */
export interface MarketPosition {
  /** This car against the comparable median, as a whole percentage: −8 is 8% below. */
  percent: number;
  /** How many comparable listings the median came from. */
  listings: number;
  /** The median itself, in major units. */
  median: number;
}

export function toMarketPosition(prices: MarketPrices): MarketPosition {
  return { percent: prices.thisCarVsMedianPercent, listings: prices.listings, median: prices.median };
}

/**
 * How comparable listings are priced, trying each of COMPARISONS in turn
 * until one finds enough; null if none does, or a read fails.
 */
export async function marketPricesFor(car: PricedCar): Promise<MarketPrices | null> {
  try {
    for (const level of COMPARISONS) {
      const compared = comparisonFor(car, level);
      const prices = await carRepository.findComparablePrices({
        make: car.make,
        model: compared.model,
        bodyType: compared.bodyType,
        year: car.year,
        yearSpan: level.yearSpan,
        excludeCarId: car.id,
        currency: car.priceCurrency,
      });
      const summary = summarizeMarketPrices(prices, { price: car.price, currency: car.priceCurrency }, compared);
      if (summary) return summary;
    }
    return null;
  } catch (error) {
    logError("Loading comparable prices failed; continuing without them", error);
    return null;
  }
}

/** A row of the comparable pool — see carRepository.findComparablePool. */
export interface PoolCar {
  id: string;
  make: string;
  model: string;
  bodyType: string;
  year: number;
  price: number;
}

const same = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: "accent" }) === 0;

/**
 * marketPricesFor, answered from a pool already in memory instead of one
 * query per rung. Must stay rung-for-rung identical to the database version:
 * same make, then the same model or body type, within the rung's year span,
 * never the car itself.
 */
export function marketPricesFromPool(car: PricedCar, pool: PoolCar[]): MarketPrices | null {
  for (const level of COMPARISONS) {
    const compared = comparisonFor(car, level);
    const prices = pool
      .filter(
        (other) =>
          other.id !== car.id &&
          same(other.make, car.make) &&
          (compared.model ? same(other.model, compared.model) : true) &&
          (compared.bodyType ? same(other.bodyType, compared.bodyType) : true) &&
          Math.abs(other.year - car.year) <= level.yearSpan
      )
      .map((other) => other.price);
    const summary = summarizeMarketPrices(prices, { price: car.price, currency: car.priceCurrency }, compared);
    if (summary) return summary;
  }
  return null;
}

const WIDEST_YEAR_SPAN = Math.max(...COMPARISONS.map((level) => level.yearSpan));

/**
 * Market positions for a page of cars, keyed by car id: one pool read per
 * currency on the page, then the ladder in memory. A car with too few
 * comparables is simply absent. Best effort — a failed read yields an empty
 * map and the cards render without a verdict rather than not at all.
 */
export async function marketPositionsFor(cars: PricedCar[]): Promise<Map<string, MarketPosition>> {
  const positions = new Map<string, MarketPosition>();
  if (cars.length === 0) return positions;

  try {
    const byCurrency = new Map<string, PricedCar[]>();
    for (const car of cars) byCurrency.set(car.priceCurrency, [...(byCurrency.get(car.priceCurrency) ?? []), car]);

    for (const [currency, group] of byCurrency) {
      const years = group.map((car) => car.year);
      const pool: PoolCar[] = await carRepository.findComparablePool({
        makes: [...new Set(group.map((car) => car.make))],
        minYear: Math.min(...years),
        maxYear: Math.max(...years),
        yearSpan: WIDEST_YEAR_SPAN,
        currency,
      });
      for (const car of group) {
        const prices = marketPricesFromPool(car, pool);
        if (prices) positions.set(car.id, toMarketPosition(prices));
      }
    }
  } catch (error) {
    logError("Loading market positions failed; listing without price verdicts", error);
    positions.clear();
  }
  return positions;
}

/** A page of serialized cars with each one's market position attached (null when unknown). */
export async function withMarketPositions<T extends PricedCar>(
  cars: T[]
): Promise<(T & { marketPosition: MarketPosition | null })[]> {
  const positions = await marketPositionsFor(cars);
  return cars.map((car) => ({ ...car, marketPosition: positions.get(car.id) ?? null }));
}
