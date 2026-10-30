import mongoose, { Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  parent: mongoose.Types.ObjectId | null;
}
