import { Document } from 'mongoose';

export type UserRole = 'admin' | 'customer';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  isActive: boolean;
  comparePassword(candidate: string): Promise<boolean>;
}

export interface ListUsersQuery {
  page: number;
  limit: number;
  role?: string;
  isActive?: string;
}
