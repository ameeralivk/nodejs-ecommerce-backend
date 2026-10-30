const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Product = require('../models/Product');
const Category = require('../models/Category');
const { getDescendantIds } = require('../utils/categoryTree');

const createProduct = asyncHandler(async (req, res) => {
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

const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');

  if (req.body.category) {
    const categoryExists = await Category.findById(req.body.category);
    if (!categoryExists) throw new ApiError(400, 'Category does not exist');
  }

  const fields = ['name', 'sku', 'description', 'price', 'salePrice', 'stock', 'category', 'status'];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) product[field] = req.body[field];
  });

  await product.save();
  res.json({ success: true, data: product });
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');

  await product.deleteOne();
  res.json({ success: true, message: 'Product deleted' });
});

const listProducts = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.max(parseInt(req.query.limit) || 10, 1);

  const filter = {};
  if (!req.query.includeInactive) filter.status = 'active';

  if (req.query.search) {
    filter.$text = { $search: req.query.search };
  }

  if (req.query.category) {
    const categoryIds = await getDescendantIds(req.query.category);
    filter.category = { $in: categoryIds };
  }

  if (req.query.minPrice || req.query.maxPrice) {
    filter.price = {};
    if (req.query.minPrice) filter.price.$gte = Number(req.query.minPrice);
    if (req.query.maxPrice) filter.price.$lte = Number(req.query.maxPrice);
  }

  const sortMap = {
    priceAsc: 'price',
    priceDesc: '-price',
    newest: '-createdAt',
    oldest: 'createdAt',
    nameAsc: 'name',
    nameDesc: '-name',
  };
  const sort = sortMap[req.query.sort] || '-createdAt';

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

const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('category', 'name');
  if (!product) throw new ApiError(404, 'Product not found');
  res.json({ success: true, data: product });
});

module.exports = { createProduct, updateProduct, deleteProduct, listProducts, getProductById };
