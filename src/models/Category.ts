import mongoose, { Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  parent: mongoose.Types.ObjectId | null;
}

const categorySchema = new mongoose.Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  },
  { timestamps: true }
);

categorySchema.index({ parent: 1 });

export default mongoose.model<ICategory>('Category', categorySchema);
