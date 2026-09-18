import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  clearOnboardingDraft,
  readOnboardingDraft,
  writeOnboardingDraft,
} from "./onboarding-draft";
import { DEFAULT_FORM_DATA } from "../_components/wizard/constants";

/**
 * What these pin: a refresh used to empty three steps of typing, and the fix
 * has to fail quietly in every case where storage does not cooperate — a
 * broken draft must never take the form down with it.
 */

const FILLED = {
  ...DEFAULT_FORM_DATA,
  name: "Cairo Premium Cars",
  email: "sales@cairopremium.example",
  phone: "01001234567",
};

class MemoryStorage {
  private map = new Map<string, string>();
  /** Set to throw from setItem, the way a full quota does. */
  full = false;

  getItem(key: string) {
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    // Models the real failure rather than a byte count: what overruns the
    // quota is the base64 logo, and the retry that drops it fits.
    if (this.full && value.includes("data:image")) {
      throw new DOMException("quota", "QuotaExceededError");
    }
    this.map.set(key, value);
  }
  removeItem(key: string) {
    this.map.delete(key);
  }
}

let store: MemoryStorage;

beforeEach(() => {
  store = new MemoryStorage();
  vi.stubGlobal("window", { sessionStorage: store });
});

describe("the onboarding draft", () => {
  it("hands back what was put in", () => {
    writeOnboardingDraft(FILLED, 2);

    const draft = readOnboardingDraft();
    expect(draft?.currentStep).toBe(2);
    expect(draft?.formData.name).toBe("Cairo Premium Cars");
    expect(draft?.formData.phone).toBe("01001234567");
  });

  it("fills in fields the stored draft never had", () => {
    // A draft written before a field existed must not restore it as undefined.
    store.setItem(
      "autome:onboarding-draft",
      JSON.stringify({ version: 1, currentStep: 1, formData: { name: "Old" } })
    );

    const draft = readOnboardingDraft();
    expect(draft?.formData.name).toBe("Old");
    expect(draft?.formData.workingHours).toEqual(DEFAULT_FORM_DATA.workingHours);
  });

  it("drops a draft written against an older shape", () => {
    store.setItem(
      "autome:onboarding-draft",
      JSON.stringify({ version: 0, currentStep: 3, formData: FILLED })
    );

    expect(readOnboardingDraft()).toBeNull();
  });

  it("drops a draft that is not JSON at all", () => {
    store.setItem("autome:onboarding-draft", "{ not json");

    expect(readOnboardingDraft()).toBeNull();
  });

  it("keeps the typing when the logo will not fit", () => {
    // The logo is a base64 data URL; a 5MB upload is more string than the whole
    // origin gets. Losing the picture beats losing the form.
    store.full = true;
    writeOnboardingDraft({ ...FILLED, logo: "data:image/png;base64," + "A".repeat(500) }, 2);

    const draft = readOnboardingDraft();
    expect(draft?.formData.name).toBe("Cairo Premium Cars");
    expect(draft?.formData.logo).toBe("");
  });

  it("is gone once cleared", () => {
    writeOnboardingDraft(FILLED, 1);
    clearOnboardingDraft();

    expect(readOnboardingDraft()).toBeNull();
  });

  it("says nothing is there when storage is denied", () => {
    // Safari's private mode throws on the property itself.
    vi.stubGlobal("window", {
      get sessionStorage(): Storage {
        throw new DOMException("denied", "SecurityError");
      },
    });

    expect(readOnboardingDraft()).toBeNull();
    expect(() => writeOnboardingDraft(FILLED, 1)).not.toThrow();
    expect(() => clearOnboardingDraft()).not.toThrow();
  });
});
