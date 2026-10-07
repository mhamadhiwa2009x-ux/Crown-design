import { describe, expect, it, vi } from "vitest";
import { clearPersistedCart } from "../client/src/hooks/useCart";

describe("cart persistence", () => {
  it("removes the persisted cart immediately when cleared", () => {
    const removeItem = vi.fn();

    clearPersistedCart({ removeItem });

    expect(removeItem).toHaveBeenCalledWith("brand_store_cart");
  });
});
