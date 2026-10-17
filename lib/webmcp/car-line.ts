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
