import { describe, expect, it } from 'vitest';
import { getCartItemCount } from '../client/src/hooks/useCart';

describe('cart icon quantity count', () => {
  it('counts every copy across all cart rows', () => {
    expect(getCartItemCount([{ quantity: 3 }, { quantity: 2 }])).toBe(5);
  });

  it('returns zero for an empty cart', () => {
    expect(getCartItemCount([])).toBe(0);
  });
});
