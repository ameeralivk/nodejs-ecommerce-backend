import asyncHandler from '../utils/asyncHandler';
import * as productService from '../services/productService';

export const createProduct = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.body);
  res.status(201).json({ success: true, data: product });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(String(req.params.id), req.body);
  res.json({ success: true, data: product });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  await productService.deleteProduct(String(req.params.id));
  res.json({ success: true, message: 'Product deleted' });
});

export const listProducts = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page as string) || 1, 1);
  const limit = Math.max(parseInt(req.query.limit as string) || 10, 1);

  const { items, total } = await productService.listProducts({
    page,
    limit,
    includeInactive: Boolean(req.query.includeInactive),
    search: req.query.search as string | undefined,
    category: req.query.category as string | undefined,
    minPrice: req.query.minPrice as string | undefined,
    maxPrice: req.query.maxPrice as string | undefined,
    sort: req.query.sort as string | undefined,
  });

  res.json({
    success: true,
    data: items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const getProductById = asyncHandler(async (req, res) => {
  const product = await productService.getProductById(String(req.params.id));
  res.json({ success: true, data: product });
});
