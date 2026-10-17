import { DEFAULT_FORM_DATA } from "../_components/wizard/constants";
import type { OnboardingFormData } from "./onboarding-types";

const STORAGE_KEY = "autome:onboarding-draft";

const VERSION = 1;

export interface OnboardingDraft {
  version: number;
  currentStep: number;
  formData: OnboardingFormData;
}

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
