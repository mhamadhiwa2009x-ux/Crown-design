export type SearchablePoster = {
  name?: string | null;
  brand?: string | null;
  description?: string | null;
  category?: string | null;
  categoryName?: string | null;
  tags?: string[] | string | null;
};

function normalizeSearchText(value: unknown): string {
  if (Array.isArray(value)) {
    return value.join(' ');
  }

  return String(value ?? '')
    .toLocaleLowerCase()
    .normalize('NFKC')
    .trim();
}

export function filterPosters<T extends SearchablePoster>(posters: T[], query: string): T[] {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return posters;

  return posters.filter((poster) => {
    const searchableText = [
      poster.name,
      poster.brand,
      poster.description,
      poster.category,
      poster.categoryName,
      poster.tags,
    ]
      .map(normalizeSearchText)
      .filter(Boolean)
      .join(' ');

    return searchableText.includes(normalizedQuery);
  });
}

export function filterPostersByCategory<T extends { categoryId?: number | null }>(
  posters: T[],
  categoryId: number | null,
): T[] {
  if (categoryId === null) return posters;
  return posters.filter((poster) => poster.categoryId === categoryId);
}
