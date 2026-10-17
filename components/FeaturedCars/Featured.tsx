import CarCard from "@/components/CarCard";
import { Reveal, RevealItem } from "@/components/Home/motion/Reveal";
import { Tilt } from "@/components/Home/motion/Tilt";
import type { SerializedCar } from "@/lib/utils/serializers";
import type { MarketPosition } from "@/lib/services/car/market-price";

export default function Featured({
  cars,
}: {
  cars: (SerializedCar & { marketPosition?: MarketPosition | null })[];
}) {
  return (
    <Reveal as="ul" className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
      {cars.map((car, index) => (
        <RevealItem as="li" key={car.id}>
          <Tilt className="h-full">
            <CarCard car={car} index={index} />
          </Tilt>
        </RevealItem>
      ))}
    </Reveal>
  );
}
