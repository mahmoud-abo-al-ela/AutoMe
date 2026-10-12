import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SuggestionLabel } from "./SuggestionLabel";

const render = (label: string, query: string) => renderToStaticMarkup(<SuggestionLabel label={label} query={query} />);
const BOLD = (text: string) => `<strong class="font-semibold">${text}</strong>`;

describe("SuggestionLabel", () => {
  it("keeps what was typed plain and makes the completion bold", () => {
    expect(render("Toyota", "toy")).toBe(`<bdi><span>Toy</span>${BOLD("ota")}</bdi>`);
  });

  it("marks each typed word where it starts a word of the label", () => {
    expect(render("Toyota Corolla", "toyota cor")).toBe(`<bdi><span>Toyota</span>${BOLD(" ")}<span>Cor</span>${BOLD("olla")}</bdi>`);
  });

  it("matches Arabic as the search folds it", () => {
    expect(render("تويوتا", "تو")).toBe(`<bdi><span>تو</span>${BOLD("يوتا")}</bdi>`);
    expect(render("هيونداي", "هيونداى")).toBe("<bdi><span>هيونداي</span></bdi>");
    expect(render("فتحة سقف", "فتحه")).toBe(`<bdi><span>فتحة</span>${BOLD(" سقف")}</bdi>`);
  });

  it("keeps a mixed Arabic and Latin label in one isolate", () => {
    expect(render("Kia Cerato", "كيا")).toBe(`<bdi>${BOLD("Kia Cerato")}</bdi>`);
  });

  it("is all completion when nothing typed starts a word of it", () => {
    expect(render("Land Cruiser", "and")).toBe(`<bdi>${BOLD("Land Cruiser")}</bdi>`);
  });

  it("shows the label plain when nothing is typed", () => {
    expect(render("Toyota", "")).toBe("<bdi>Toyota</bdi>");
    expect(render("Toyota", "   ")).toBe("<bdi>Toyota</bdi>");
  });

  it("never renders the label as markup", () => {
    expect(render("<img src=x> Toy", "toy")).toContain("&lt;img");
    expect(render("<img src=x> Toy", "toy")).not.toContain("<img");
  });

  it("leaves the text itself, and so the option's accessible name, unchanged", () => {
    const text = render("Toyota Corolla", "toyota cor").replace(/<[^>]+>/g, "");
    expect(text).toBe("Toyota Corolla");
  });
});
