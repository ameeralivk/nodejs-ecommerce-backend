import asyncHandler from '../utils/asyncHandler';
import ApiError from '../utils/ApiError';
import User from '../models/User';
import { generateToken } from '../utils/jwt';

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, 'Email is already registered');

  const user = await User.create({ name, email, password, role: 'customer' });
  const token = generateToken(user);

  res.status(201).json({ success: true, data: { user, token } });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }
  if (!user.isActive) throw new ApiError(403, 'Your account has been deactivated');

  const token = generateToken(user);
  res.json({ success: true, data: { user, token } });
});
