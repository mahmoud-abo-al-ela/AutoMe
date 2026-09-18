import { describe, expect, it } from "vitest";
import {
  isEgyptNationalPhone,
  isEgyptPhone,
  LOCAL_MAX_LENGTH,
  LOCAL_MIN_LENGTH,
  toLatinDigits,
  toLocalEgyptPhone,
  toNationalEgyptPhone,
  toPhoneDigits,
  toPhoneField,
} from "./phone";

describe("toNationalEgyptPhone", () => {
  it.each([
    ["a bare national number", "1001234567", "1001234567"],
    ["the domestic trunk zero", "01001234567", "1001234567"],
    ["spaces and dashes", "010 0123-4567", "1001234567"],
    ["an international prefix", "+20 100 123 4567", "1001234567"],
    ["the 00 access code", "0020 100 123 4567", "1001234567"],
    ["a trunk zero after the code", "+20 0100 123 4567", "1001234567"],
    ["parentheses", "(+20) 100-123-4567", "1001234567"],
  ])("reads %s", (_case, input, expected) => {
    expect(toNationalEgyptPhone(input)).toBe(expected);
  });

  it("peels the country code twice", () => {
    // What pasting a full number into a field that already shows "+20" gives.
    expect(toNationalEgyptPhone("+20+201001234567")).toBe("1001234567");
    expect(toNationalEgyptPhone("2020 100 123 4567")).toBe("1001234567");
    expect(toNationalEgyptPhone("0020 0020 1001234567")).toBe("1001234567");
  });

  it("stops at two, so a third is not silently eaten", () => {
    // One code survives, which fails validation — better than quietly
    // accepting whatever is left after peeling as many as it takes.
    const peeled = toNationalEgyptPhone("+20+20+201001234567");
    expect(peeled).toBe("201001234567");
    expect(isEgyptNationalPhone(peeled)).toBe(false);
  });

  it("reads Arabic-Indic digits", () => {
    expect(toNationalEgyptPhone("٠١٠٠١٢٣٤٥٦٧")).toBe("1001234567");
    expect(toNationalEgyptPhone("+٢٠ ١٠٠ ١٢٣ ٤٥٦٧")).toBe("1001234567");
  });

  it("keeps a Cairo landline that merely starts with 2", () => {
    // 2 is Cairo's area code, so "20…" is not always the country code.
    expect(toNationalEgyptPhone("02 2555 1234")).toBe("225551234");
    expect(toNationalEgyptPhone("225551234")).toBe("225551234");
  });

  it("leaves a half-typed number alone", () => {
    // Mid-keystroke the peel would otherwise eat the area code the moment a
    // second digit appeared.
    expect(toNationalEgyptPhone("2")).toBe("2");
    expect(toNationalEgyptPhone("20")).toBe("20");
    expect(toNationalEgyptPhone("2025")).toBe("2025");
  });

  it("gives nothing back for nothing", () => {
    expect(toNationalEgyptPhone("")).toBe("");
    expect(toNationalEgyptPhone("abc")).toBe("");
  });

  it("holds a lone country code, which is not yet a number either way", () => {
    // Too short to peel, and too short to validate — so it stays visible
    // rather than vanishing from under the caret.
    expect(toNationalEgyptPhone("+20")).toBe("20");
    expect(isEgyptNationalPhone(toNationalEgyptPhone("+20"))).toBe(false);
  });

  it("hands back an over-long number rather than trimming it", () => {
    // Silently dropping the digits past the tenth would accept a number the
    // dealer never typed; validation rejects it instead.
    expect(toNationalEgyptPhone("100123456789999")).toBe("100123456789999");
    expect(isEgyptNationalPhone(toNationalEgyptPhone("100123456789999"))).toBe(
      false
    );
  });
});

describe("toPhoneDigits", () => {
  it("keeps the digits and nothing else", () => {
    expect(toPhoneDigits("+20 (100) 123-4567")).toBe("201001234567");
    expect(toPhoneDigits("abc")).toBe("");
  });

  it("rewrites Eastern digits as Western ones", () => {
    // What the phone field shows on an Arabic page: the number a dealer types
    // in Arabic numerals reads back in the form it will be dialled in.
    expect(toLatinDigits("٠١٠٠ ١٢٣٤٥٦٧")).toBe("0100 1234567");
    expect(toLatinDigits("۰۱۰۰")).toBe("0100");
    expect(toLatinDigits("no digits here")).toBe("no digits here");
  });
});

describe("isEgyptNationalPhone", () => {
  it.each(["1001234567", "225551234", "12345678"])("accepts %s", (value) => {
    expect(isEgyptNationalPhone(value)).toBe(true);
  });

  it.each([
    ["too short", "1234567"],
    ["too long", "12345678901"],
    ["a leading trunk zero", "01001234567"],
    ["letters", "10012345ab"],
    ["empty", ""],
  ])("rejects %s", (_case, value) => {
    expect(isEgyptNationalPhone(value)).toBe(false);
  });
});

describe("toLocalEgyptPhone", () => {
  it("settles every spelling on the one Egyptians write", () => {
    expect(toLocalEgyptPhone("1001234567")).toBe("01001234567");
    expect(toLocalEgyptPhone("01001234567")).toBe("01001234567");
    expect(toLocalEgyptPhone("+20 100 123 4567")).toBe("01001234567");
    expect(toLocalEgyptPhone("٠١٠٠ ١٢٣ ٤٥٦٧")).toBe("01001234567");
  });

  it("round-trips, so storing and reopening does not change the number", () => {
    const stored = toLocalEgyptPhone("+20 100 123 4567");
    expect(toLocalEgyptPhone(stored)).toBe(stored);
  });

  it("stays empty rather than becoming a bare zero", () => {
    expect(toLocalEgyptPhone("")).toBe("");
  });
});

describe("toPhoneField", () => {
  it("leaves a number that is still being typed alone", () => {
    // Including the leading zero, which peeling would otherwise swallow the
    // instant it was typed.
    expect(toPhoneField("0")).toBe("0");
    expect(toPhoneField("0100")).toBe("0100");
    expect(toPhoneField("01001234567")).toBe("01001234567");
  });

  it("peels rather than truncates when a paste runs over", () => {
    // Cutting "+201001234567" to eleven characters would leave "20100123456",
    // a number the dealer never had.
    expect(toPhoneField("+20 100 123 4567")).toBe("01001234567");
    expect(toPhoneField("0020 100 123 4567")).toBe("01001234567");
  });

  it("stops at the cap when peeling cannot save it", () => {
    expect(toPhoneField("012345678901234")).toHaveLength(LOCAL_MAX_LENGTH);
  });

  it("drops everything that is not a digit", () => {
    expect(toPhoneField("(010) 123-4567")).toBe("0101234567");
    expect(toPhoneField("٠١٠٠١٢٣٤٥٦٧")).toBe("01001234567");
  });
});

describe("the quoted length bounds", () => {
  it("match what validation actually accepts", () => {
    // The bounds are quoted in the error message; the pattern is what rejects
    // the number. Nothing else would notice them drifting apart.
    const shortest = "1".repeat(LOCAL_MIN_LENGTH - 1);
    const longest = "1".repeat(LOCAL_MAX_LENGTH - 1);

    expect(isEgyptNationalPhone(shortest)).toBe(true);
    expect(isEgyptNationalPhone(longest)).toBe(true);
    expect(isEgyptNationalPhone("1".repeat(LOCAL_MIN_LENGTH - 2))).toBe(false);
    expect(isEgyptNationalPhone("1".repeat(LOCAL_MAX_LENGTH))).toBe(false);
  });

  it("describe the local form, zero included", () => {
    expect(toLocalEgyptPhone("1001234567")).toHaveLength(LOCAL_MAX_LENGTH);
  });
});

describe("isEgyptPhone", () => {
  it.each(["01001234567", "1001234567", "+20 100 123 4567", "0225551234"])(
    "accepts %s, whatever shape it arrived in",
    (value) => {
      expect(isEgyptPhone(value)).toBe(true);
    }
  );

  it.each([
    ["too short", "01001"],
    ["too long", "0100123456789"],
    ["empty", ""],
    ["not a number at all", "call me"],
  ])("rejects %s", (_case, value) => {
    expect(isEgyptPhone(value)).toBe(false);
  });
});
