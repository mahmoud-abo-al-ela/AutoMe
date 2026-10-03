import CarCard from "@/components/CarCard";
import type { SerializedCar } from "@/lib/utils/serializers";
import type { MarketPosition } from "@/lib/services/car/market-price";

/**
 * Featured cars on the home page: a plain grid, 2-up on phones and 4-up from
 * lg. It used to be an autoplaying carousel, which moved while people read it
 * and offered no pause. Rendered from the server's read (no client refetch
 * and no loading skeleton on first paint).
 */
export default function Featured({
  cars,
}: {
  cars: (SerializedCar & { marketPosition?: MarketPosition | null })[];
}) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
      {cars.map((car, index) => (
        <li key={car.id}>
          <CarCard car={car} index={index} />
        </li>
      ))}
    </ul>
  );
}
