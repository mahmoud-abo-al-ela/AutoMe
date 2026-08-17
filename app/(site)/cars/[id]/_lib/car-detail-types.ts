import type { getCarById } from "@/actions/cars-listing";
import type { ActionResponse } from "@/lib/utils/response";

/** Unwrap an action's success payload from the ActionResponse envelope. */
type PayloadOf<T> = Awaited<T> extends ActionResponse<infer D> ? D : never;

/**
 * The car the detail page renders: a serialized car (number price, ISO
 * timestamps, `{url, alt}` images) plus the viewer's wishlist state.
 */
export type CarDetail = PayloadOf<ReturnType<typeof getCarById>>;

/** One gallery image. `serializeCarWithImages` always produces this shape. */
export type CarDetailImage = CarDetail["images"][number];

/** The selling dealership, joined onto the car by the detail query. */
export type CarDetailOrganization = NonNullable<CarDetail["organization"]>;

/** `formatCarPrice` bound at the hook so presenters stay currency-agnostic. */
export type PriceFormatter = (price: number) => string;
