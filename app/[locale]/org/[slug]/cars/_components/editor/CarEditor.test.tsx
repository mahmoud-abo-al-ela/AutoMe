import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import org from "@/messages/en/org.json";
import carAttributes from "@/messages/en/carAttributes.json";
import common from "@/messages/en/common.json";
import errors from "@/messages/en/errors.json";
import { CarEditor } from "./CarEditor";

vi.mock("next/navigation", () => ({ useParams: () => ({ slug: "nile-motors" }) }));
vi.mock("@/i18n/navigation", () => ({ useRouter: () => ({ push: vi.fn() }), Link: () => null }));
vi.mock("@/actions/cars", () => ({
  addCar: vi.fn(),
  updateCarFull: vi.fn(),
  getCarPlanLimits: vi.fn(),
  getMaxImagesPerCar: vi.fn(),
  reviewListingQuality: vi.fn(),
  comparePrice: vi.fn(),
}));
vi.mock("@/actions/plan", () => ({ getPlanGateStatus: vi.fn() }));

/**
 * The editor still renders its first step and its actions now that reading
 * the details from the photos lives in usePhotoReading.
 */

const messages = { org, carAttributes, common, errors };

function render(mode: "add" | "edit") {
  return renderToStaticMarkup(
    <QueryClientProvider client={new QueryClient()}>
      <NextIntlClientProvider locale="en" messages={messages} timeZone="Africa/Cairo">
        <CarEditor mode={mode} carId={mode === "edit" ? "car-1" : null} title={<h1>Heading</h1>} />
      </NextIntlClientProvider>
    </QueryClientProvider>
  );
}

describe("CarEditor", () => {
  it("adds a car a step at a time, from the photos", () => {
    const html = render("add");
    expect(html).toContain("<h1>Heading</h1>");
    expect(html).toContain(org.carForm.editor.noteAdd);
    expect(html).toContain(">Continue<");
    expect(html).not.toContain(org.carForm.editor.saveChanges);
  });

  it("offers to save from any step when editing", () => {
    const html = render("edit");
    expect(html).toContain(org.carForm.editor.noteEdit);
    expect(html).toContain(org.carForm.editor.saveChanges);
  });
});
