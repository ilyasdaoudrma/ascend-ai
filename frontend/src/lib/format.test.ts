import { describe, it, expect } from "vitest";
import { cn, fmtKg, fmtNum } from "./format";

describe("format utilities", () => {
  it("cn joins truthy class names", () => {
    expect(cn("a", false, "b", null, undefined, "c")).toBe("a b c");
  });

  it("fmtNum handles nullish values", () => {
    expect(fmtNum(null)).toBe("—");
    // Locale-independent: 1234 renders the digits 1, 2, 3, 4 in order.
    expect(fmtNum(1234).replace(/\D/g, "")).toBe("1234");
  });

  it("fmtKg formats kilograms", () => {
    expect(fmtKg(82.4)).toMatch(/82.4 kg/);
    expect(fmtKg(null)).toBe("—");
  });
});
