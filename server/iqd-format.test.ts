import { describe, expect, it } from "vitest";
import { formatIqdAmount, normalizeIqdInput, parseIqdAmount } from "../shared/iqd";

describe("Iraqi Dinar formatting", () => {
  it("treats 22.000 as twenty-two thousand dinars", () => {
    expect(parseIqdAmount("22.000")).toBe(22000);
    expect(formatIqdAmount("22.000")).toBe("22.000");
    expect(normalizeIqdInput("22.000")).toBe("22000.00");
  });

  it("formats database decimal strings with Iraqi thousands separators", () => {
    expect(formatIqdAmount("22000.00")).toBe("22.000");
    expect(formatIqdAmount("20000.00")).toBe("20.000");
    expect(formatIqdAmount("1.500.000")).toBe("1.500.000");
  });

  it("supports comma-separated entry without fractional dinars", () => {
    expect(parseIqdAmount("1,500,000")).toBe(1_500_000);
    expect(formatIqdAmount("1,500,000")).toBe("1.500.000");
  });
});
