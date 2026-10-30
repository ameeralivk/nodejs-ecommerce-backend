import asyncHandler from '../utils/asyncHandler';
import ApiError from '../utils/ApiError';
import User from '../models/User';

export const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.user });
});

export const updateMe = asyncHandler(async (req, res) => {
  const { name, email } = req.body;
  const user = req.user!;

  if (email) {
    const existing = await User.findOne({ email, _id: { $ne: user._id } });
    if (existing) throw new ApiError(409, 'Email is already in use');
    user.email = email;
  }

  if (name) user.name = name;

  await user.save();
  res.json({ success: true, data: user });
});

export const listUsers = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page as string) || 1, 1);
  const limit = Math.max(parseInt(req.query.limit as string) || 10, 1);

  const filter: Record<string, unknown> = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: users,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ success: true, data: user });
});

export const setUserStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');

  if (String(user._id) === String(req.user!._id)) {
    throw new ApiError(400, 'You cannot change your own account status');
  }

  user.isActive = isActive;
  await user.save();
  res.json({ success: true, data: user });
});
