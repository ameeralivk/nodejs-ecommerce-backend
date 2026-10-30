import mongoose from 'mongoose';
import Category, { ICategory } from '../models/Category';

type CategoryId = mongoose.Types.ObjectId | string;

export const buildTree = (categories: ICategory[], parentId: CategoryId | null = null): Record<string, unknown>[] =>
  categories
    .filter((cat) => String(cat.parent) === String(parentId))
    .map((cat) => ({
      ...cat.toObject(),
      children: buildTree(categories, cat._id as mongoose.Types.ObjectId),
    }));

// Walks up from newParentId towards the root. If categoryId is found along
// the way, newParentId lives inside categoryId's own subtree, so assigning
// it as the parent would create a cycle.
export const wouldCreateCycle = async (categoryId: CategoryId, newParentId: CategoryId): Promise<boolean> => {
  if (String(categoryId) === String(newParentId)) return true;

  let current = await Category.findById(newParentId);
  while (current && current.parent) {
    if (String(current.parent) === String(categoryId)) return true;
    current = await Category.findById(current.parent);
  }
  return false;
};

// Returns categoryId plus every descendant id, level by level, so product
// filtering by a parent category also matches products in its subcategories.
export const getDescendantIds = async (categoryId: CategoryId): Promise<CategoryId[]> => {
  const ids: CategoryId[] = [categoryId];
  let frontier: CategoryId[] = [categoryId];

  while (frontier.length) {
    const children = await Category.find({ parent: { $in: frontier } }).select('_id');
    frontier = children.map((c) => c._id as mongoose.Types.ObjectId);
    ids.push(...frontier);
  }

  return ids;
};
