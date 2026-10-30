const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Category = require('../models/Category');
const Product = require('../models/Product');
const { buildTree, wouldCreateCycle } = require('../utils/categoryTree');

const createCategory = asyncHandler(async (req, res) => {
  const { name, parent } = req.body;

  if (parent) {
    const parentCategory = await Category.findById(parent);
    if (!parentCategory) throw new ApiError(400, 'Parent category does not exist');
  }

  const category = await Category.create({ name, parent: parent || null });
  res.status(201).json({ success: true, data: category });
});

const updateCategory = asyncHandler(async (req, res) => {
  const { name, parent } = req.body;

  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found');

  if (parent !== undefined) {
    if (parent === null) {
      category.parent = null;
    } else {
      if (String(parent) === String(category._id)) {
        throw new ApiError(400, 'A category cannot be its own parent');
      }

      const parentCategory = await Category.findById(parent);
      if (!parentCategory) throw new ApiError(400, 'Parent category does not exist');

      if (await wouldCreateCycle(category._id, parent)) {
        throw new ApiError(400, 'This change would create a circular category relationship');
      }

      category.parent = parent;
    }
  }

  if (name) category.name = name;

  await category.save();
  res.json({ success: true, data: category });
});

const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found');

  const childCount = await Category.countDocuments({ parent: category._id });
  if (childCount > 0) {
    throw new ApiError(400, 'Cannot delete a category that has subcategories');
  }

  const productCount = await Product.countDocuments({ category: category._id });
  if (productCount > 0) {
    throw new ApiError(400, 'Cannot delete a category that has products assigned to it');
  }

  await category.deleteOne();
  res.json({ success: true, message: 'Category deleted' });
});

const listCategories = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.parent !== undefined) {
    filter.parent = req.query.parent === 'null' ? null : req.query.parent;
  }

  const categories = await Category.find(filter).sort('name');
  res.json({ success: true, data: categories });
});

const getCategoryTree = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort('name');
  const tree = buildTree(categories, null);
  res.json({ success: true, data: tree });
});

const getCategoryById = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found');
  res.json({ success: true, data: category });
});

module.exports = {
  createCategory,
  updateCategory,
  deleteCategory,
  listCategories,
  getCategoryTree,
  getCategoryById,
};
