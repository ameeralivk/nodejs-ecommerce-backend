import asyncHandler from '../utils/asyncHandler';
import ApiError from '../utils/ApiError';
import Category from '../models/Category';
import Product from '../models/Product';
import { buildTree, wouldCreateCycle } from '../utils/categoryTree';

export const createCategory = asyncHandler(async (req, res) => {
  const { name, parent } = req.body;

  if (parent) {
    const parentCategory = await Category.findById(parent);
    if (!parentCategory) throw new ApiError(400, 'Parent category does not exist');
  }

  const category = await Category.create({ name, parent: parent || null });
  res.status(201).json({ success: true, data: category });
});

export const updateCategory = asyncHandler(async (req, res) => {
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

      if (await wouldCreateCycle(category._id as any, parent)) {
        throw new ApiError(400, 'This change would create a circular category relationship');
      }

      category.parent = parent;
    }
  }

  if (name) category.name = name;

  await category.save();
  res.json({ success: true, data: category });
});

export const deleteCategory = asyncHandler(async (req, res) => {
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

export const listCategories = asyncHandler(async (req, res) => {
  const filter: Record<string, unknown> = {};
  if (req.query.parent !== undefined) {
    filter.parent = req.query.parent === 'null' ? null : req.query.parent;
  }

  const categories = await Category.find(filter).sort('name');
  res.json({ success: true, data: categories });
});

export const getCategoryTree = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort('name');
  const tree = buildTree(categories, null);
  res.json({ success: true, data: tree });
});

export const getCategoryById = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found');
  res.json({ success: true, data: category });
});
