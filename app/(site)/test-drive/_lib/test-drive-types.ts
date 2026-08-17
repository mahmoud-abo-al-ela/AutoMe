import type { serializeTestDrive } from "@/lib/utils/serializers";

/**
 * A test drive as it leaves the repository, minus the car. `serializePartialCar`
 * erases the joined car to `Record<string, unknown>` because the test-drive
 * repository is JS by design (dynamic where builders), so the two car shapes are
 * declared below and re-attached rather than inferred.
 */
type SerializedTestDrive = NonNullable<ReturnType<typeof serializeTestDrive>>;

/**
 * The car fields `findManyTestDrives` selects for the list view.
 */
export interface TestDriveListCar {
  id: string;
  title: string | null;
  make: string;
  model: string;
  year: number;
  price: number;
  images: string[];
}

/**
 * The car fields `findTestDriveById` selects — deliberately narrower than the
 * list's. Anything beyond id/title is not available on the detail view.
 */
export interface TestDriveDetailCar {
  id: string;
  title: string | null;
}

/** One row in the user's test-drive list. */
export type TestDriveListItem = Omit<SerializedTestDrive, "car"> & {
  car: TestDriveListCar | null;
};

/** The single test drive shown by the view/edit modes. */
export type TestDriveDetail = Omit<SerializedTestDrive, "car"> & {
  car: TestDriveDetailCar | null;
};

/**
 * The list pagination, with the page/status callbacks the hook attaches to it.
 */
export interface TestDrivePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  status: string;
  onPageChange: (page: number) => void;
  onStatusChange: (status: string) => void;
}
