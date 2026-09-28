import { describe, it, expect } from "vitest";
import { placePhoto, type ImportGroup } from "@/lib/utils/photo-groups";

const cars = (): ImportGroup[] => [
  { id: 1, label: "white Elantra", photos: [0, 1, 2, 3], readWith: [1, 2] },
  { id: 2, label: "red K5", photos: [4, 5], readWith: [4] },
];
let next = 100;
const newId = () => next++;

describe("placePhoto", () => {
  it("reorders within a car — onto the cover makes it the cover", () => {
    expect(placePhoto(cars(), 2, 1, 0, newId)[0].photos).toEqual([2, 0, 1, 3]);
    expect(placePhoto(cars(), 0, 1, 3, newId)[0].photos).toEqual([1, 2, 3, 0]);
  });

  it("changes nothing when dropped on its own car without a place", () => {
    const before = cars();
    expect(placePhoto(before, 2, 1, undefined, newId)).toBe(before);
  });

  it("moves a photo into another car at a place, or at its end", () => {
    const at = placePhoto(cars(), 3, 2, 0, newId);
    expect(at.map((g) => g.photos)).toEqual([[0, 1, 2], [3, 4, 5]]);
    const end = placePhoto(cars(), 3, 2, undefined, newId);
    expect(end[1].photos).toEqual([4, 5, 3]);
  });

  it("lets a moved photo help identify its new car, up to three", () => {
    expect(placePhoto(cars(), 0, 2, undefined, newId)[1].readWith).toEqual([4, 0]);
  });

  it("gives a photo a car of its own", () => {
    const moved = placePhoto(cars(), 5, null, undefined, () => 7);
    expect(moved.at(-1)).toEqual({ id: 7, label: "", photos: [5], readWith: [5] });
    expect(moved[1].photos).toEqual([4]);
  });

  it("drops a car left empty, and refills one that lost its identifying photos", () => {
    const one: ImportGroup[] = [
      { id: 1, label: "", photos: [0], readWith: [0] },
      { id: 2, label: "", photos: [1, 2, 3], readWith: [1] },
    ];
    expect(placePhoto(one, 0, 2, undefined, newId).map((g) => g.id)).toEqual([2]);
    expect(placePhoto(one, 1, 1, undefined, newId)[1].readWith).toEqual([2, 3]);
  });
});
