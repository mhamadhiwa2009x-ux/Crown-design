export const ENTRY_GATE_STORAGE_KEY = 'crown_design_entry_verified';

export interface EntryGateStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function hasVerifiedEntry(storage: Pick<EntryGateStorage, 'getItem'>): boolean {
  return storage.getItem(ENTRY_GATE_STORAGE_KEY) === 'true';
}

export function markEntryVerified(storage: Pick<EntryGateStorage, 'setItem'>): void {
  storage.setItem(ENTRY_GATE_STORAGE_KEY, 'true');
}
