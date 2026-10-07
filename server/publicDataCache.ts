type CacheEntry<T> = {
  value: T;
  freshUntil: number;
  staleUntil: number;
};

const entries = new Map<string, CacheEntry<unknown>>();
const refreshes = new Map<string, Promise<unknown>>();

export async function getCachedPublicData<T>(
  key: string,
  loader: () => Promise<T>,
  options: { freshForMs?: number; staleForMs?: number } = {},
): Promise<T> {
  const freshForMs = options.freshForMs ?? 30_000;
  const staleForMs = options.staleForMs ?? 5 * 60_000;
  const now = Date.now();
  const cached = entries.get(key) as CacheEntry<T> | undefined;

  if (cached && now < cached.freshUntil) return cached.value;

  const loadAndStore = async () => {
    const value = await loader();
    const storedAt = Date.now();
    entries.set(key, {
      value,
      freshUntil: storedAt + freshForMs,
      staleUntil: storedAt + freshForMs + staleForMs,
    });
    return value;
  };

  if (cached && now < cached.staleUntil) {
    if (!refreshes.has(key)) {
      const refresh = loadAndStore()
        .catch(error => {
          console.warn(`[PublicDataCache] Background refresh failed for ${key}:`, error);
          return cached.value;
        })
        .finally(() => refreshes.delete(key));
      refreshes.set(key, refresh);
    }
    return cached.value;
  }

  const existingRefresh = refreshes.get(key) as Promise<T> | undefined;
  if (existingRefresh) return existingRefresh;

  const refresh = loadAndStore().finally(() => refreshes.delete(key));
  refreshes.set(key, refresh);
  return refresh;
}

export function invalidatePublicData(...keys: string[]) {
  keys.forEach(key => entries.delete(key));
}

export function clearPublicDataCache() {
  entries.clear();
  refreshes.clear();
}
