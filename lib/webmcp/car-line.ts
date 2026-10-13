/**
 * One car as a WebMCP tool lists it: enough for an agent to tell cars apart
 * and act on one (its id), short enough that a page of them stays inside
 * Chrome's output budget (WEBMCP_BUDGETS.output). "car" is make and model as
 * the dealer entered them — text others wrote, so tools that return it say
 * so with `untrustedContentHint`.
 */
export interface ListedCar {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
}

export function carLine(car: ListedCar) {
  return { id: car.id, car: `${car.make} ${car.model}`, year: car.year, priceEgp: car.price, km: car.mileage };
}
