import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { NextIntlClientProvider } from "next-intl";
import en from "@/messages/en/common.json";
import ar from "@/messages/ar/common.json";
import type { SearchSuggestion } from "@/lib/search/suggest";

// The network suggestions are another test's business; here the field is empty or typed.
const typedSuggestions = vi.hoisted(() => ({ list: [] as SearchSuggestion[] }));
vi.mock("./use-search-suggestions", () => ({ useSearchSuggestions: () => typedSuggestions.list }));

import { SuggestionList } from "./SuggestionList";
import { useSearchBox } from "./use-search-box";
import { MAX_RECENT_SEARCHES, recentSearchKey, withRecentSearch, type RecentSearch } from "./use-recent-searches";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const KEY = "autome:recent-searches";
const stored = (): RecentSearch[] => JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
const seed = (list: RecentSearch[]) => window.localStorage.setItem(KEY, JSON.stringify(list));

const TOYOTA: RecentSearch = { label: "Toyota", filters: { make: "Toyota" } };
const SEDAN: RecentSearch = { label: "Sedan", filters: { bodyType: "Sedan" } };
const CAMRY: RecentSearch = { label: "camry", search: "camry" };

describe("withRecentSearch", () => {
  it("puts the newest first and keeps the last five", () => {
    let list: RecentSearch[] = [];
    for (let i = 0; i < 7; i++) list = withRecentSearch(list, { label: `q${i}`, search: `q${i}` });
    expect(list.map((item) => item.label)).toEqual(["q6", "q5", "q4", "q3", "q2"]);
    expect(list).toHaveLength(MAX_RECENT_SEARCHES);
  });

  it("keeps one copy of a search, moved to the top", () => {
    const list = withRecentSearch([TOYOTA, SEDAN], { label: "Toyota", filters: { make: "Toyota" } });
    expect(list).toEqual([TOYOTA, SEDAN]);
    expect(withRecentSearch([TOYOTA, CAMRY], { label: "Camry ", search: " CAMRY" }).map((i) => i.label)).toEqual(["Camry", "Toyota"]);
  });

  it("never keeps an empty or blank search", () => {
    expect(withRecentSearch([TOYOTA], { label: "   ", search: "   " })).toEqual([TOYOTA]);
    expect(withRecentSearch([TOYOTA], { label: "x" })).toEqual([TOYOTA]);
  });

  it("keys a search by what it sets, not by its label or the order of its filters", () => {
    expect(recentSearchKey({ filters: { make: "Kia", bodyType: "SUV" } })).toBe(recentSearchKey({ filters: { bodyType: "SUV", make: "Kia" } }));
    expect(recentSearchKey({ search: "Camry" })).toBe(recentSearchKey({ search: " camry " }));
  });
});

function Box({ query, onPick }: { query: string; onPick: (s: SearchSuggestion) => void }) {
  const { options, combobox, remember } = useSearchBox(query, onPick);
  return (
    <div className="relative">
      <input aria-label="Search" value={query} readOnly {...combobox.inputProps} />
      <button type="button" data-remember onClick={() => remember(query)} />
      <SuggestionList query={query} suggestions={options} {...combobox.listProps} />
    </div>
  );
}

let container: HTMLDivElement;
let root: Root;
let onPick: ReturnType<typeof vi.fn<(s: SearchSuggestion) => void>>;

function mount(query = "", locale: "en" | "ar" = "en") {
  act(() => {
    root.render(
      <NextIntlClientProvider locale={locale} messages={{ common: locale === "ar" ? ar : en }} timeZone="Africa/Cairo">
        <Box query={query} onPick={onPick} />
      </NextIntlClientProvider>
    );
  });
}

const input = () => container.querySelector("input")!;
const list = () => container.querySelector('[role="listbox"]') as HTMLUListElement;
const options = () => [...container.querySelectorAll('[role="option"]')] as HTMLElement[];
const removeButtons = () => [...container.querySelectorAll("button[aria-label]")] as HTMLButtonElement[];
const focus = () => act(() => input().focus());
function key(name: string) {
  const event = new KeyboardEvent("keydown", { key: name, bubbles: true, cancelable: true });
  act(() => {
    input().dispatchEvent(event);
  });
  return event;
}

beforeEach(() => {
  window.localStorage.clear();
  typedSuggestions.list = [];
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  onPick = vi.fn<(s: SearchSuggestion) => void>();
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
});

describe("recent searches in the search box", () => {
  it("shows them when the field is focused and empty", () => {
    seed([TOYOTA, CAMRY]);
    mount();
    focus();
    expect(list().hidden).toBe(false);
    expect(list().getAttribute("aria-label")).toBe("Recent searches");
    expect(options().map((option) => option.textContent)).toEqual(["Toyota", "camry"]);
  });

  it("shows suggestions instead once something is typed", () => {
    seed([TOYOTA]);
    typedSuggestions.list = [{ kind: "model", label: "Kia Cerato", count: 3, filters: { make: "Kia" }, search: "Cerato" }];
    mount("ki");
    focus();
    expect(options().map((option) => option.textContent)).toEqual(["Kia CeratoModel3 cars"]);
  });

  it("has a remove button beside each option, never inside it, out of the tab order", () => {
    seed([TOYOTA]);
    mount();
    focus();
    const [button] = removeButtons();
    expect(button.getAttribute("aria-label")).toBe("Remove “Toyota” from recent searches");
    expect(button.closest('[role="option"]')).toBeNull();
    expect(button.tabIndex).toBe(-1);
  });

  it("removes one with its button, and forgets it", () => {
    seed([TOYOTA, CAMRY]);
    mount();
    focus();
    act(() => removeButtons()[0].click());
    expect(options().map((option) => option.textContent)).toEqual(["camry"]);
    expect(stored()).toEqual([CAMRY]);
    expect(onPick).not.toHaveBeenCalled();
  });

  it("removes the highlighted one with Delete, and moves on to the next", () => {
    seed([TOYOTA, SEDAN, CAMRY]);
    mount();
    focus();
    key("ArrowDown");
    expect(key("Delete").defaultPrevented).toBe(true);
    expect(stored().map((item) => item.label)).toEqual(["Sedan", "camry"]);
    expect(options()[0].getAttribute("aria-selected")).toBe("true");
    key("Delete");
    expect(stored().map((item) => item.label)).toEqual(["camry"]);
  });

  it("leaves Delete alone with nothing highlighted", () => {
    seed([TOYOTA]);
    mount();
    focus();
    expect(key("Delete").defaultPrevented).toBe(false);
    expect(stored()).toEqual([TOYOTA]);
  });

  it("chooses one as the suggestion it came from, and moves it to the top", () => {
    seed([TOYOTA, SEDAN]);
    mount();
    focus();
    key("ArrowDown");
    key("ArrowDown");
    key("Enter");
    expect(onPick).toHaveBeenCalledWith({ kind: "recent", label: "Sedan", count: 0, filters: { bodyType: "Sedan" }, search: undefined });
    expect(stored().map((item) => item.label)).toEqual(["Sedan", "Toyota"]);
  });

  it("remembers a submitted query, and a chosen suggestion", () => {
    typedSuggestions.list = [{ kind: "make", label: "Toyota", count: 7, filters: { make: "Toyota" } }];
    mount("toy");
    act(() => (container.querySelector("[data-remember]") as HTMLButtonElement).click());
    expect(stored()).toEqual([{ label: "toy", search: "toy" }]);
    focus();
    key("ArrowDown");
    key("Enter");
    expect(stored()).toEqual([TOYOTA, { label: "toy", search: "toy" }]);
  });

  it("works without storage: nothing shown, nothing thrown", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    mount("toy");
    expect(() => act(() => (container.querySelector("[data-remember]") as HTMLButtonElement).click())).not.toThrow();
  });

  it("ignores what is not a list of searches", () => {
    window.localStorage.setItem(KEY, "{not json");
    mount();
    focus();
    expect(options()).toEqual([]);
    window.localStorage.setItem(KEY, JSON.stringify([{ label: 3 }, { label: "ok", search: "ok" }, "junk"]));
    act(() => root.unmount());
    root = createRoot(container);
    mount();
    focus();
    expect(options().map((option) => option.textContent)).toEqual(["ok"]);
  });

  it("speaks Arabic", () => {
    seed([{ label: "سيدان", filters: { bodyType: "Sedan" } }]);
    mount("", "ar");
    focus();
    expect(list().getAttribute("aria-label")).toBe("عمليات البحث الأخيرة");
    expect(removeButtons()[0].getAttribute("aria-label")).toBe("إزالة «سيدان» من عمليات البحث الأخيرة");
  });
});
