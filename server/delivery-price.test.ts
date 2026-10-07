import { describe, expect, it } from 'vitest';
import { formatIqdAmount, parseIqdAmount } from '../shared/iqd';

describe('cart delivery price totals', () => {
  it('adds the configured delivery price without decimal-currency rounding', () => {
    const subtotal = parseIqdAmount('22.000');
    const delivery = parseIqdAmount('5.000');
    const total = subtotal + delivery;

    expect(formatIqdAmount(subtotal)).toBe('22.000');
    expect(formatIqdAmount(delivery)).toBe('5.000');
    expect(formatIqdAmount(total)).toBe('27.000');
  });
});
