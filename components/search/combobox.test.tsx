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
  { kind: "make", label: "Toyota", count: 7, make: "Toyota" },
  { kind: "model", label: "Toyota Corolla", count: 4, make: "Toyota", search: "Corolla" },
  { kind: "word", label: "sunroof", count: 3, search: "sunroof" },
];

function Harness({ suggestions, onPick }: { suggestions: SearchSuggestion[]; onPick: (s: SearchSuggestion) => void }) {
  const combobox = useSuggestionCombobox(suggestions, onPick);
  return (
    <div className="relative">
      <input aria-label="Search" defaultValue="toy" {...combobox.inputProps} />
      <SuggestionList suggestions={suggestions} {...combobox.listProps} />
    </div>
  );
}

let container: HTMLDivElement;
let root: Root;
let onPick: ReturnType<typeof vi.fn<(suggestion: SearchSuggestion) => void>>;

function mount(locale: "en" | "ar" = "en", suggestions = SUGGESTIONS) {
  act(() => {
    root.render(
      <NextIntlClientProvider locale={locale} messages={{ common: locale === "ar" ? ar : en }} timeZone="Africa/Cairo">
        <Harness suggestions={suggestions} onPick={onPick} />
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

  it("stays closed with no suggestions", () => {
    mount("en", []);
    focus();
    expect(input().getAttribute("aria-expanded")).toBe("false");
    expect(list().hidden).toBe(true);
  });

  it("says what each suggestion is and how many cars, in Arabic", () => {
    mount("ar", [{ kind: "make", label: "تويوتا", count: 1, make: "Toyota" }]);
    focus();
    const [option] = options();
    expect(option.textContent).toContain("تويوتا");
    expect(option.textContent).toContain("الماركة");
    expect(option.textContent).toContain("سيارة واحدة");
  });
});
