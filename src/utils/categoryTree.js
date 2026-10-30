const Category = require('../models/Category');

const buildTree = (categories, parentId = null) =>
  categories
    .filter((cat) => String(cat.parent) === String(parentId))
    .map((cat) => ({
      ...cat.toObject(),
      children: buildTree(categories, cat._id),
    }));

// Walks up from newParentId towards the root. If categoryId is found along
// the way, newParentId lives inside categoryId's own subtree, so assigning
// it as the parent would create a cycle.
const wouldCreateCycle = async (categoryId, newParentId) => {
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
const getDescendantIds = async (categoryId) => {
  const ids = [categoryId];
  let frontier = [categoryId];

  while (frontier.length) {
    const children = await Category.find({ parent: { $in: frontier } }).select('_id');
    frontier = children.map((c) => c._id);
    ids.push(...frontier);
  }

  return ids;
};

module.exports = { buildTree, wouldCreateCycle, getDescendantIds };
