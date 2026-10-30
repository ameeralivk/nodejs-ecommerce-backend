import mongoose, { Document } from 'mongoose';

export type ProductStatus = 'active' | 'inactive';

export interface IProduct extends Document {
  name: string;
  sku: string;
  description: string;
  price: number;
  salePrice: number | null;
  stock: number;
  category: mongoose.Types.ObjectId;
  status: ProductStatus;
}

export interface ProductInput {
  name: string;
  sku: string;
  description?: string;
  price: number;
  salePrice?: number | null;
  stock: number;
  category: string;
  status?: string;
}

export interface ListProductsQuery {
  page: number;
  limit: number;
  includeInactive?: boolean;
  search?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
}
