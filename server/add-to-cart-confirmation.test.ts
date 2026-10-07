import { describe, expect, it } from "vitest";
import { CART_ADDED_MESSAGE } from "../shared/const";

describe("add-to-cart confirmation", () => {
  it("uses the requested Kurdish success message", () => {
    expect(CART_ADDED_MESSAGE).toBe("زیادکرا");
  });
});
