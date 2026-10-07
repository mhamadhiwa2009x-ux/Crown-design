import { describe, expect, it } from 'vitest';
import {
  ENTRY_GATE_STORAGE_KEY,
  hasVerifiedEntry,
  markEntryVerified,
} from '../shared/entry-gate';

describe('entry gate verification', () => {
  it('starts unverified and becomes verified in the current session storage', () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    };

    expect(hasVerifiedEntry(storage)).toBe(false);
    markEntryVerified(storage);
    expect(values.get(ENTRY_GATE_STORAGE_KEY)).toBe('true');
    expect(hasVerifiedEntry(storage)).toBe(true);
  });
});
