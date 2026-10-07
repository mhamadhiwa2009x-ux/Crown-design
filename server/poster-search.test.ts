import { describe, expect, it } from 'vitest';
import { filterPosters, filterPostersByCategory } from '../shared/search';

describe('poster search', () => {
  const posters = [
    {
      name: 'Golden Horizon',
      brand: 'Crown Design',
      description: 'A cinematic desert poster',
      category: 'landscape',
      categoryId: 1,
      categoryName: 'BMW',
      tags: ['gold', 'desert'],
    },
    {
      name: 'Midnight Bloom',
      brand: 'Noir Studio',
      description: 'Botanical wall art',
      category: 'floral',
      categoryId: 2,
      categoryName: 'Coffee Shop',
      tags: ['black', 'botanical'],
    },
  ];

  it('matches title, brand, description, category, and tags without case sensitivity', () => {
    expect(filterPosters(posters, 'horizon')).toHaveLength(1);
    expect(filterPosters(posters, 'NOIR')).toHaveLength(1);
    expect(filterPosters(posters, 'wall art')).toHaveLength(1);
    expect(filterPosters(posters, 'FLORAL')).toHaveLength(1);
    expect(filterPosters(posters, 'desert')).toHaveLength(1);
    expect(filterPosters(posters, 'coffee shop')).toHaveLength(1);
  });

  it('returns every poster for an empty query and none for an unknown query', () => {
    expect(filterPosters(posters, '')).toHaveLength(2);
    expect(filterPosters(posters, 'does-not-exist')).toHaveLength(0);
  });

  it('filters posters by category ID and restores all posters when the filter is cleared', () => {
    expect(filterPostersByCategory(posters, 1)).toEqual([posters[0]]);
    expect(filterPostersByCategory(posters, 2)).toEqual([posters[1]]);
    expect(filterPostersByCategory(posters, null)).toEqual(posters);
  });
});
