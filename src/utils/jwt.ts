import jwt from 'jsonwebtoken';
import { IUser } from '../models/User';

export interface JwtPayload {
  id: string;
  role: string;
}

export const generateToken = (user: IUser): string =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET as string, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  } as jwt.SignOptions);
