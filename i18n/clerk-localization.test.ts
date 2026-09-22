import { describe, expect, it } from "vitest";
import { arSA, enUS } from "@clerk/localizations";
import { clerkLocalization } from "./clerk-localization";

/**
 * These assertions exist to survive a `@clerk/localizations` upgrade.
 *
 * The corrections below patch strings inside a third-party bundle, addressed by
 * path. An upgrade can silently do two things: fix the string upstream (making
 * our override redundant) or move the key (making it a no-op that leaves the
 * wrong Arabic on screen). Both are invisible without a test, because a stale
 * override neither throws nor fails to compile.
 */
describe("clerkLocalization", () => {
  const ar = clerkLocalization.ar as Record<string, never>;
  const at = (path: string, source: object): unknown =>
    path.split(".").reduce<unknown>(
      (node, key) =>
        node == null ? undefined : (node as Record<string, unknown>)[key],
      source
    );

  it("passes English through untouched", () => {
    expect(clerkLocalization.en).toBe(enUS);
  });

  it("corrects the Arabic strings Clerk ships wrong", () => {
    // "أنشاء" -> "إنشاء". The bundle contradicts itself: it spells the same
    // verbal noun correctly in signIn.start.actionLink.
    expect(at("signUp.start.title", ar)).toBe("إنشاء حساب جديد");
    // Form I "enter [a place]" -> form IV "enter [a value]".
    expect(at("signIn.password.title", ar)).toBe("أدخل كلمة المرور");
    // "electronic address" -> the ordinary word for email.
    expect(ar.formFieldLabel__emailAddress).toBe("البريد الإلكتروني");
    // Imperative of اختار takes hamzat wasl: bare alef.
    expect(ar.footerActionLink__useAnotherMethod).toBe("اختر طريقة أخرى");
  });

  it("still needs every correction it makes", () => {
    // If one of these starts failing, Clerk fixed it upstream and the
    // corresponding override should be deleted rather than carried forever.
    expect(at("signUp.start.title", arSA)).not.toBe("إنشاء حساب جديد");
    expect(at("signIn.password.title", arSA)).not.toBe("أدخل كلمة المرور");
    expect(arSA.formFieldLabel__emailAddress).not.toBe("البريد الإلكتروني");
    expect(arSA.footerActionLink__useAnotherMethod).not.toBe(
      "اختر طريقة أخرى"
    );
  });

  it("merges by path instead of replacing whole branches", () => {
    // The failure this guards against: a shallow spread would replace the
    // entire `signUp` object with the one key we override, and every other
    // sign-up string would fall back to English mid-form.
    expect(at("signUp.start.subtitle", ar)).toBe(
      at("signUp.start.subtitle", arSA)
    );
    expect(at("signUp.start.actionText", ar)).toBe(
      at("signUp.start.actionText", arSA)
    );
    expect(at("signIn.start.title", ar)).toBe(at("signIn.start.title", arSA));
  });

  it("leaves the upstream bundle unmutated", () => {
    expect(at("signUp.start.title", arSA)).toBe("أنشاء حساب جديد");
  });
});
