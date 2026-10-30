import ApiError from '../utils/ApiError';
import User, { IUser } from '../models/User';
import { generateToken } from '../utils/jwt';

interface AuthResult {
  user: IUser;
  token: string;
}

export const register = async (name: string, email: string, password: string): Promise<AuthResult> => {
  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, 'Email is already registered');

  const user = await User.create({ name, email, password, role: 'customer' });
  const token = generateToken(user);

  return { user, token };
};

export const login = async (email: string, password: string): Promise<AuthResult> => {
  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }
  if (!user.isActive) throw new ApiError(403, 'Your account has been deactivated');

  const token = generateToken(user);
  return { user, token };
};
