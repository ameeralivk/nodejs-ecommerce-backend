import ApiError from '../utils/ApiError';
import Category from '../models/Category';
import Product from '../models/Product';
import { buildTree, wouldCreateCycle } from '../utils/categoryTree';
import { ICategory } from '../types/category.types';

export const createCategory = async (name: string, parent?: string | null): Promise<ICategory> => {
  if (parent) {
    const parentCategory = await Category.findById(parent);
    if (!parentCategory) throw new ApiError(400, 'Parent category does not exist');
  }

  return Category.create({ name, parent: parent || null });
};

export const updateCategory = async (
  id: string,
  data: { name?: string; parent?: string | null }
): Promise<ICategory> => {
  const category = await Category.findById(id);
  if (!category) throw new ApiError(404, 'Category not found');

  if (data.parent !== undefined) {
    if (data.parent === null) {
      category.parent = null;
    } else {
      if (String(data.parent) === String(category._id)) {
        throw new ApiError(400, 'A category cannot be its own parent');
      }

      const parentCategory = await Category.findById(data.parent);
      if (!parentCategory) throw new ApiError(400, 'Parent category does not exist');

      if (await wouldCreateCycle(category._id as any, data.parent)) {
        throw new ApiError(400, 'This change would create a circular category relationship');
      }

      category.parent = data.parent as any;
    }
  }

  if (data.name) category.name = data.name;

  await category.save();
  return category;
};

export const deleteCategory = async (id: string): Promise<void> => {
  const category = await Category.findById(id);
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
};

export const listCategories = async (parent?: string): Promise<ICategory[]> => {
  const filter: Record<string, unknown> = {};
  if (parent !== undefined) {
    filter.parent = parent === 'null' ? null : parent;
  }

  return Category.find(filter).sort('name');
};

export const getCategoryTree = async (): Promise<Record<string, unknown>[]> => {
  const categories = await Category.find().sort('name');
  return buildTree(categories, null);
};

export const getCategoryById = async (id: string): Promise<ICategory> => {
  const category = await Category.findById(id);
  if (!category) throw new ApiError(404, 'Category not found');
  return category;
};
