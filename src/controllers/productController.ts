import asyncHandler from '../utils/asyncHandler';
import ApiError from '../utils/ApiError';
import Product from '../models/Product';
import Category from '../models/Category';
import { getDescendantIds } from '../utils/categoryTree';

export const createProduct = asyncHandler(async (req, res) => {
  const { name, sku, description, price, salePrice, stock, category, status } = req.body;

  const categoryExists = await Category.findById(category);
  if (!categoryExists) throw new ApiError(400, 'Category does not exist');

  const product = await Product.create({
    name,
    sku,
    description,
    price,
    salePrice,
    stock,
    category,
    status,
  });

  res.status(201).json({ success: true, data: product });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');

  if (req.body.category) {
    const categoryExists = await Category.findById(req.body.category);
    if (!categoryExists) throw new ApiError(400, 'Category does not exist');
  }

  const fields = ['name', 'sku', 'description', 'price', 'salePrice', 'stock', 'category', 'status'] as const;
  fields.forEach((field) => {
    if (req.body[field] !== undefined) (product as any)[field] = req.body[field];
  });

  await product.save();
  res.json({ success: true, data: product });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');

  await product.deleteOne();
  res.json({ success: true, message: 'Product deleted' });
});

export const listProducts = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page as string) || 1, 1);
  const limit = Math.max(parseInt(req.query.limit as string) || 10, 1);

  const filter: Record<string, unknown> = {};
  if (!req.query.includeInactive) filter.status = 'active';

  if (req.query.search) {
    filter.$text = { $search: req.query.search as string };
  }

  if (req.query.category) {
    const categoryIds = await getDescendantIds(req.query.category as string);
    filter.category = { $in: categoryIds };
  }

  if (req.query.minPrice || req.query.maxPrice) {
    const price: Record<string, number> = {};
    if (req.query.minPrice) price.$gte = Number(req.query.minPrice);
    if (req.query.maxPrice) price.$lte = Number(req.query.maxPrice);
    filter.price = price;
  }

  const sortMap: Record<string, string> = {
    priceAsc: 'price',
    priceDesc: '-price',
    newest: '-createdAt',
    oldest: 'createdAt',
    nameAsc: 'name',
    nameDesc: '-name',
  };
  const sort = sortMap[req.query.sort as string] || '-createdAt';

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit),
    Product.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: products,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('category', 'name');
  if (!product) throw new ApiError(404, 'Product not found');
  res.json({ success: true, data: product });
});
