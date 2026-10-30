import { describe, it, expect } from 'vitest';
import Category from '../../src/models/Category';
import { buildTree, wouldCreateCycle, getDescendantIds } from '../../src/utils/categoryTree';

const createChain = async () => {
  const electronics = await Category.create({ name: 'Electronics', parent: null });
  const mobiles = await Category.create({ name: 'Mobiles', parent: electronics._id });
  const androidPhones = await Category.create({ name: 'Android Phones', parent: mobiles._id });
  return { electronics, mobiles, androidPhones };
};

describe('buildTree', () => {
  it('nests categories under their parent at every level', async () => {
    await createChain();
    const categories = await Category.find().sort('name');
    const tree = buildTree(categories, null);

    expect(tree).toHaveLength(1);
    expect(tree[0].name).toBe('Electronics');

    const children = tree[0].children as Record<string, unknown>[];
    expect(children).toHaveLength(1);
    expect(children[0].name).toBe('Mobiles');

    const grandchildren = children[0].children as Record<string, unknown>[];
    expect(grandchildren).toHaveLength(1);
    expect(grandchildren[0].name).toBe('Android Phones');
  });
});

describe('wouldCreateCycle', () => {
  it('flags a category as its own parent', async () => {
    const { electronics } = await createChain();
    expect(await wouldCreateCycle(electronics._id, electronics._id)).toBe(true);
  });

  it('flags reassigning a category under its own descendant', async () => {
    const { electronics, androidPhones } = await createChain();
    // Electronics -> Android Phones would put Electronics inside its own subtree.
    expect(await wouldCreateCycle(electronics._id, androidPhones._id)).toBe(true);
  });

  it('allows reassigning a descendant under a non-descendant ancestor', async () => {
    const { electronics, androidPhones } = await createChain();
    expect(await wouldCreateCycle(androidPhones._id, electronics._id)).toBe(false);
  });
});

describe('getDescendantIds', () => {
  it('returns the category plus every descendant, and nothing more for a leaf', async () => {
    const { electronics, mobiles, androidPhones } = await createChain();

    const fromRoot = (await getDescendantIds(electronics._id)).map(String);
    expect(fromRoot.sort()).toEqual(
      [electronics._id, mobiles._id, androidPhones._id].map(String).sort()
    );

    const fromLeaf = (await getDescendantIds(androidPhones._id)).map(String);
    expect(fromLeaf).toEqual([String(androidPhones._id)]);
  });
});
