import { DEFAULT_FORM_DATA } from "../_components/wizard/constants";
import type { OnboardingFormData } from "./onboarding-types";

/**
 * The wizard's answers, kept across a page reload.
 *
 * Three steps of typing lived in React state alone, so a refresh — or a
 * misplaced browser Back — emptied the whole form and sent the dealer back to
 * step one. This is the smallest thing that fixes that.
 *
 * `sessionStorage`, not `localStorage`: the draft holds a name, an email, a
 * phone number and an address. Surviving a reload is the whole requirement;
 * outliving the tab on a shared machine is not, and would leave that on disk
 * indefinitely.
 */
const STORAGE_KEY = "autome:onboarding-draft";

/**
 * Bumped when the shape changes. An older draft is dropped rather than merged,
 * which is what the day-key reorder would otherwise have demanded: a draft
 * written before it holds working hours the form no longer has fields for.
 */
const VERSION = 1;

export interface OnboardingDraft {
  version: number;
  currentStep: number;
  formData: OnboardingFormData;
}

/**
 * Storage access itself can throw — Safari's private mode denies it outright —
 * so every entry point here is guarded. A draft is a convenience; failing to
 * read or write one must never take the form down with it.
 */
function session(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

export function readOnboardingDraft(): OnboardingDraft | null {
  const store = session();
  if (!store) return null;

  try {
    const raw = store.getItem(STORAGE_KEY);
    if (!raw) return null;

    const draft = JSON.parse(raw) as Partial<OnboardingDraft>;
    if (draft.version !== VERSION || !draft.formData) return null;

    return {
      version: VERSION,
      currentStep: draft.currentStep ?? 1,
      // Merged over the defaults so a field added since the draft was written
      // arrives defined rather than undefined.
      formData: { ...DEFAULT_FORM_DATA, ...draft.formData },
    };
  } catch {
    return null;
  }
}

export function writeOnboardingDraft(
  formData: OnboardingFormData,
  currentStep: number
): void {
  const store = session();
  if (!store) return;

  const draft: OnboardingDraft = { version: VERSION, currentStep, formData };

  try {
    store.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Almost always the quota, and almost always the logo: it is held as a
    // base64 data URL, and a 5MB upload is ~6.7MB of string — more than the
    // whole origin gets. Keeping the typing and losing the picture is a far
    // better refresh than losing both.
    try {
      store.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...draft, formData: { ...formData, logo: "" } })
      );
    } catch {
      // Storage is unavailable or full beyond saving. Nothing to do: the
      // wizard works exactly as it did before this file existed.
    }
  }
}

export function clearOnboardingDraft(): void {
  try {
    session()?.removeItem(STORAGE_KEY);
  } catch {
    // See above — a failed clear costs nothing the next screen depends on.
  }
}
