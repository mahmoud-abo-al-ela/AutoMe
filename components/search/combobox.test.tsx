import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { NextIntlClientProvider } from "next-intl";
import en from "@/messages/en/common.json";
import ar from "@/messages/ar/common.json";
import type { SearchSuggestion } from "@/lib/search/suggest";
import { SuggestionList } from "./SuggestionList";
import { nextActive, useSuggestionCombobox } from "./use-suggestion-combobox";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const SUGGESTIONS: SearchSuggestion[] = [
  { kind: "make", label: "Toyota", count: 7, filters: { make: "Toyota" } },
  { kind: "model", label: "Toyota Corolla", count: 4, filters: { make: "Toyota" }, search: "Corolla" },
  { kind: "model", label: "Toyota Camry", count: 3, filters: { make: "Toyota" }, search: "Camry" },
];

function Harness({
  suggestions,
  onPick,
  showCounts,
  query,
}: {
  suggestions: SearchSuggestion[];
  onPick: (s: SearchSuggestion) => void;
  showCounts?: boolean;
  query: string;
}) {
  const combobox = useSuggestionCombobox(suggestions, onPick);
  return (
    <div className="relative">
      <input aria-label="Search" defaultValue={query} {...combobox.inputProps} />
      <SuggestionList query={query} suggestions={suggestions} showCounts={showCounts} {...combobox.listProps} />
    </div>
  );
}

let container: HTMLDivElement;
let root: Root;
let onPick: ReturnType<typeof vi.fn<(suggestion: SearchSuggestion) => void>>;

function mount(locale: "en" | "ar" = "en", suggestions = SUGGESTIONS, showCounts?: boolean, query = "toy") {
  act(() => {
    root.render(
      <NextIntlClientProvider locale={locale} messages={{ common: locale === "ar" ? ar : en }} timeZone="Africa/Cairo">
        <Harness suggestions={suggestions} onPick={onPick} showCounts={showCounts} query={query} />
      </NextIntlClientProvider>
    );
  });
}

const input = () => container.querySelector("input")!;
const list = () => container.querySelector('[role="listbox"]') as HTMLUListElement;
const options = () => [...container.querySelectorAll('[role="option"]')] as HTMLLIElement[];
const selected = () => options().findIndex((option) => option.getAttribute("aria-selected") === "true");

function key(name: string) {
  const event = new KeyboardEvent("keydown", { key: name, bubbles: true, cancelable: true });
  act(() => {
    input().dispatchEvent(event);
  });
  return event;
}

function focus() {
  act(() => input().focus());
}

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  onPick = vi.fn<(suggestion: SearchSuggestion) => void>();
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe("nextActive", () => {
  it("moves down and up, wrapping, and ignores other keys", () => {
    expect(nextActive(-1, "ArrowDown", 3)).toBe(0);
    expect(nextActive(2, "ArrowDown", 3)).toBe(0);
    expect(nextActive(-1, "ArrowUp", 3)).toBe(2);
    expect(nextActive(0, "ArrowUp", 3)).toBe(2);
    expect(nextActive(1, "a", 3)).toBeNull();
    expect(nextActive(-1, "ArrowDown", 0)).toBeNull();
  });
});

describe("the search combobox", () => {
  it("is a closed combobox until the field has focus", () => {
    mount();
    expect(input().getAttribute("role")).toBe("combobox");
    expect(input().getAttribute("aria-autocomplete")).toBe("list");
    expect(input().getAttribute("aria-controls")).toBe(list().id);
    expect(input().getAttribute("aria-expanded")).toBe("false");
    expect(list().hidden).toBe(true);
  });

  it("opens on focus with nothing highlighted, and announces how many", () => {
    mount();
    focus();
    expect(input().getAttribute("aria-expanded")).toBe("true");
    expect(list().hidden).toBe(false);
    expect(input().hasAttribute("aria-activedescendant")).toBe(false);
    expect(container.querySelector('[aria-live="polite"]')?.textContent).toBe("3 suggestions");
  });

  it("moves the highlight with the arrows, keeping focus in the field", () => {
    mount();
    focus();
    expect(key("ArrowDown").defaultPrevented).toBe(true);
    expect(selected()).toBe(0);
    expect(input().getAttribute("aria-activedescendant")).toBe(options()[0].id);
    key("ArrowDown");
    key("ArrowDown");
    key("ArrowDown");
    expect(selected()).toBe(0);
    key("ArrowUp");
    expect(selected()).toBe(2);
    expect(document.activeElement).toBe(input());
  });

  it("takes the highlighted suggestion on Enter, instead of submitting", () => {
    mount();
    focus();
    key("ArrowDown");
    key("ArrowDown");
    const enter = key("Enter");
    expect(enter.defaultPrevented).toBe(true);
    expect(onPick).toHaveBeenCalledWith(SUGGESTIONS[1]);
    expect(input().getAttribute("aria-expanded")).toBe("false");
  });

  it("leaves Enter to the field when nothing is highlighted", () => {
    mount();
    focus();
    expect(key("Enter").defaultPrevented).toBe(false);
    expect(onPick).not.toHaveBeenCalled();
  });

  it("closes on Escape and keeps the text", () => {
    mount();
    focus();
    key("ArrowDown");
    expect(key("Escape").defaultPrevented).toBe(true);
    expect(input().getAttribute("aria-expanded")).toBe("false");
    expect(input().value).toBe("toy");
    expect(input().hasAttribute("aria-activedescendant")).toBe(false);
  });

  it("closes on Tab", () => {
    mount();
    focus();
    key("Tab");
    expect(input().getAttribute("aria-expanded")).toBe("false");
  });

  it("takes a suggestion on click without the field losing focus first", () => {
    mount();
    focus();
    const mousedown = new MouseEvent("mousedown", { bubbles: true, cancelable: true });
    act(() => {
      options()[2].dispatchEvent(mousedown);
    });
    expect(mousedown.defaultPrevented).toBe(true);
    act(() => options()[2].click());
    expect(onPick).toHaveBeenCalledWith(SUGGESTIONS[2]);
  });

  it("highlights an option the mouse moves over, but not one that slides under a resting pointer", () => {
    mount();
    focus();
    key("ArrowDown");
    act(() => {
      options()[2].dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    });
    expect(selected()).toBe(0);
    act(() => {
      options()[2].dispatchEvent(new MouseEvent("mousemove", { bubbles: true }));
    });
    expect(selected()).toBe(2);
  });

  it("names each spec's kind, in Arabic", () => {
    mount("ar", [
      { kind: "bodyType", label: "سيدان", count: 4, filters: { bodyType: "Sedan" } },
      { kind: "feature", label: "فتحة سقف", count: 2, search: "فتحة سقف" },
    ]);
    focus();
    expect(options()[0].textContent).toContain("نوع الهيكل");
    expect(options()[1].textContent).toContain("ميزة");
  });

  it("leaves the counts out where they would misstate the results", () => {
    mount("en", SUGGESTIONS, false);
    focus();
    expect(options()[0].textContent).toBe("ToyotaMake");
  });

  it("shows what was typed plain and the completion bold, in English and Arabic", () => {
    mount();
    focus();
    expect(options()[0].querySelector("strong")?.textContent).toBe("ota");
    act(() => root.unmount());
    root = createRoot(container);
    mount("ar", [{ kind: "make", label: "تويوتا", count: 7, filters: { make: "Toyota" } }], true, "تو");
    focus();
    expect(options()[0].querySelector("strong")?.textContent).toBe("يوتا");
    // The marks change no text: the option still reads, and is picked, as before.
    key("ArrowDown");
    key("Enter");
    expect(onPick).toHaveBeenCalledWith(expect.objectContaining({ label: "تويوتا" }));
  });

  it("scrolls the highlighted option into view as the arrows move", () => {
    const scrolled: string[] = [];
    const original = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function (this: Element) {
      scrolled.push(this.textContent ?? "");
    };
    try {
      mount();
      focus();
      key("ArrowDown");
      key("ArrowDown");
      key("ArrowDown");
      expect(scrolled).toEqual([options()[0].textContent, options()[1].textContent, options()[2].textContent]);
    } finally {
      Element.prototype.scrollIntoView = original;
    }
  });

  it("stays closed with no suggestions", () => {
    mount("en", []);
    focus();
    expect(input().getAttribute("aria-expanded")).toBe("false");
    expect(list().hidden).toBe(true);
  });

  it("says what each suggestion is and how many cars, in Arabic", () => {
    mount("ar", [{ kind: "make", label: "تويوتا", count: 1, filters: { make: "Toyota" } }]);
    focus();
    const [option] = options();
    expect(option.textContent).toContain("تويوتا");
    expect(option.textContent).toContain("الماركة");
    expect(option.textContent).toContain("سيارة واحدة");
  });
});
