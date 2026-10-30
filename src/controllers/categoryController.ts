import asyncHandler from '../utils/asyncHandler';
import * as categoryService from '../services/categoryService';

export const createCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.createCategory(req.body.name, req.body.parent);
  res.status(201).json({ success: true, data: category });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.updateCategory(String(req.params.id), req.body);
  res.json({ success: true, data: category });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  await categoryService.deleteCategory(String(req.params.id));
  res.json({ success: true, message: 'Category deleted' });
});

export const listCategories = asyncHandler(async (req, res) => {
  const parent = req.query.parent !== undefined ? String(req.query.parent) : undefined;
  const categories = await categoryService.listCategories(parent);
  res.json({ success: true, data: categories });
});

export const getCategoryTree = asyncHandler(async (req, res) => {
  const tree = await categoryService.getCategoryTree();
  res.json({ success: true, data: tree });
});

export const getCategoryById = asyncHandler(async (req, res) => {
  const category = await categoryService.getCategoryById(String(req.params.id));
  res.json({ success: true, data: category });
});
