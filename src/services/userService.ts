import ApiError from '../utils/ApiError';
import User, { IUser } from '../models/User';

interface ListUsersQuery {
  page: number;
  limit: number;
  role?: string;
  isActive?: string;
}

interface PaginatedResult<T> {
  items: T[];
  total: number;
}

export const updateProfile = async (
  user: IUser,
  data: { name?: string; email?: string }
): Promise<IUser> => {
  if (data.email) {
    const existing = await User.findOne({ email: data.email, _id: { $ne: user._id } });
    if (existing) throw new ApiError(409, 'Email is already in use');
    user.email = data.email;
  }

  if (data.name) user.name = data.name;

  await user.save();
  return user;
};

export const listUsers = async (query: ListUsersQuery): Promise<PaginatedResult<IUser>> => {
  const filter: Record<string, unknown> = {};
  if (query.role) filter.role = query.role;
  if (query.isActive !== undefined) filter.isActive = query.isActive === 'true';

  const [items, total] = await Promise.all([
    User.find(filter)
      .sort('-createdAt')
      .skip((query.page - 1) * query.limit)
      .limit(query.limit),
    User.countDocuments(filter),
  ]);

  return { items, total };
};

export const getUserById = async (id: string): Promise<IUser> => {
  const user = await User.findById(id);
  if (!user) throw new ApiError(404, 'User not found');
  return user;
};

export const setUserStatus = async (
  requesterId: string,
  targetId: string,
  isActive: boolean
): Promise<IUser> => {
  const user = await User.findById(targetId);
  if (!user) throw new ApiError(404, 'User not found');

  if (String(user._id) === String(requesterId)) {
    throw new ApiError(400, 'You cannot change your own account status');
  }

  user.isActive = isActive;
  await user.save();
  return user;
};
