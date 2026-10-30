import mongoose from 'mongoose';
import { ICategory } from '../types/category.types';

const categorySchema = new mongoose.Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  },
  { timestamps: true }
);

categorySchema.index({ parent: 1 });

export default mongoose.model<ICategory>('Category', categorySchema);
