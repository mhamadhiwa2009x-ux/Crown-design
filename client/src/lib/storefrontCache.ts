import type { Category, Product } from '../../../drizzle/schema';

export const STOREFRONT_CACHE_KEY = 'crown-design-storefront-v1';
export const STOREFRONT_CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
export const STOREFRONT_QUERY_STALE_TIME_MS = 60_000;

export type CachedStorefrontProduct = Omit<Product, 'thumbnailUrl'> & {
  thumbnailUrl: string | null;
  categoryName: string | null;
  categoryIconUrl: string | null;
};

export type StorefrontSnapshot = {
  version: 1;
  savedAt: number;
  products: CachedStorefrontProduct[];
  categories: Category[];
  settings: {
    storeName: string;
    storeDescription: string;
    deliveryPrice: string;
  } | null;
};

type StorageReader = Pick<Storage, 'getItem'>;
type StorageWriter = Pick<Storage, 'setItem'>;

export function readStorefrontSnapshot(
  storage: StorageReader,
  now = Date.now(),
): StorefrontSnapshot | null {
  try {
    const raw = storage.getItem(STOREFRONT_CACHE_KEY);
    if (!raw) return null;

    const snapshot = JSON.parse(raw) as StorefrontSnapshot;
    if (
      snapshot.version !== 1 ||
      !Array.isArray(snapshot.products) ||
      !Array.isArray(snapshot.categories) ||
      typeof snapshot.savedAt !== 'number' ||
      now - snapshot.savedAt > STOREFRONT_CACHE_MAX_AGE_MS
    ) {
      return null;
    }

    return {
      ...snapshot,
      settings: snapshot.settings
        ? { ...snapshot.settings, storeDescription: snapshot.settings.storeDescription || '' }
        : null,
      products: snapshot.products.map(product => ({
        ...product,
        thumbnailUrl: product.thumbnailUrl ?? null,
        createdAt: new Date(product.createdAt),
      })),
      categories: snapshot.categories.map(category => ({
        ...category,
        createdAt: new Date(category.createdAt),
        updatedAt: new Date(category.updatedAt),
      })),
    };
  } catch {
    return null;
  }
}

export function writeStorefrontSnapshot(
  storage: StorageWriter,
  data: Omit<StorefrontSnapshot, 'version' | 'savedAt'>,
  now = Date.now(),
) {
  storage.setItem(STOREFRONT_CACHE_KEY, JSON.stringify({
    version: 1,
    savedAt: now,
    ...data,
  } satisfies StorefrontSnapshot));
}
