import { describe, expect, it } from 'vitest';
import { mergeCartItems, type CartItem } from '../client/src/hooks/useCart';

const item = (quantity: number): CartItem => ({
  productId: 7,
  productName: 'Classic Poster',
  productBrand: 'Crown Design',
  price: '22.000',
  imageUrl: '/poster.jpg',
  quantity,
});

describe('repeated cart items', () => {
  it('merges repeated additions into the requested quantity', () => {
    const merged = mergeCartItems([item(1), item(1), item(1)]);

    expect(merged).toHaveLength(1);
    expect(merged[0].quantity).toBe(3);
    expect(merged[0].imageUrl).toBe('/poster.jpg');
  });

  it('normalizes duplicate entries loaded from older cart storage', () => {
    const merged = mergeCartItems([item(2), item(3)]);

    expect(merged).toEqual([{ ...item(2), quantity: 5 }]);
  });
});
