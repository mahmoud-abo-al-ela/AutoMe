import type {
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormTrigger,
  UseFormWatch,
} from "react-hook-form";
import type { CarFormValues } from "@/hooks/use-car-form";

/**
 * The react-hook-form handles the car form sections receive. Each section
 * `Pick`s the subset it actually uses, so an unused handle shows up as a
 * missing prop rather than dead weight.
 */
export interface CarFormSectionProps {
  register: UseFormRegister<CarFormValues>;
  errors: FieldErrors<CarFormValues>;
  watch: UseFormWatch<CarFormValues>;
  setValue: UseFormSetValue<CarFormValues>;
  trigger: UseFormTrigger<CarFormValues>;
}
