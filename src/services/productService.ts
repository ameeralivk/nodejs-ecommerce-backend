import ApiError from '../utils/ApiError';
import Product, { IProduct } from '../models/Product';
import Category from '../models/Category';
import { getDescendantIds } from '../utils/categoryTree';

interface ProductInput {
  name: string;
  sku: string;
  description?: string;
  price: number;
  salePrice?: number | null;
  stock: number;
  category: string;
  status?: string;
}

interface ListProductsQuery {
  page: number;
  limit: number;
  includeInactive?: boolean;
  search?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
}

interface PaginatedResult<T> {
  items: T[];
  total: number;
}

const SORT_MAP: Record<string, string> = {
  priceAsc: 'price',
  priceDesc: '-price',
  newest: '-createdAt',
  oldest: 'createdAt',
  nameAsc: 'name',
  nameDesc: '-name',
};

export const createProduct = async (data: ProductInput): Promise<IProduct> => {
  const categoryExists = await Category.findById(data.category);
  if (!categoryExists) throw new ApiError(400, 'Category does not exist');

  return Product.create(data as any);
};

export const updateProduct = async (id: string, data: Partial<ProductInput>): Promise<IProduct> => {
  const product = await Product.findById(id);
  if (!product) throw new ApiError(404, 'Product not found');

  if (data.category) {
    const categoryExists = await Category.findById(data.category);
    if (!categoryExists) throw new ApiError(400, 'Category does not exist');
  }

  const fields = ['name', 'sku', 'description', 'price', 'salePrice', 'stock', 'category', 'status'] as const;
  fields.forEach((field) => {
    if (data[field] !== undefined) (product as any)[field] = data[field];
  });

  await product.save();
  return product;
};

export const deleteProduct = async (id: string): Promise<void> => {
  const product = await Product.findById(id);
  if (!product) throw new ApiError(404, 'Product not found');
  await product.deleteOne();
};

export const listProducts = async (query: ListProductsQuery): Promise<PaginatedResult<IProduct>> => {
  const filter: Record<string, unknown> = {};
  if (!query.includeInactive) filter.status = 'active';

  if (query.search) {
    filter.$text = { $search: query.search };
  }

  if (query.category) {
    const categoryIds = await getDescendantIds(query.category);
    filter.category = { $in: categoryIds };
  }

  if (query.minPrice || query.maxPrice) {
    const price: Record<string, number> = {};
    if (query.minPrice) price.$gte = Number(query.minPrice);
    if (query.maxPrice) price.$lte = Number(query.maxPrice);
    filter.price = price;
  }

  const sort = SORT_MAP[query.sort || ''] || '-createdAt';

  const [items, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name')
      .sort(sort)
      .skip((query.page - 1) * query.limit)
      .limit(query.limit),
    Product.countDocuments(filter),
  ]);

  return { items, total };
};

export const getProductById = async (id: string): Promise<IProduct> => {
  const product = await Product.findById(id).populate('category', 'name');
  if (!product) throw new ApiError(404, 'Product not found');
  return product;
};
