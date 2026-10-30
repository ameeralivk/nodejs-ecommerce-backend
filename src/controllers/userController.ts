import asyncHandler from '../utils/asyncHandler';
import * as userService from '../services/userService';

export const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.user });
});

export const updateMe = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user!, req.body);
  res.json({ success: true, data: user });
});

export const listUsers = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page as string) || 1, 1);
  const limit = Math.max(parseInt(req.query.limit as string) || 10, 1);

  const { items, total } = await userService.listUsers({
    page,
    limit,
    role: req.query.role as string | undefined,
    isActive: req.query.isActive as string | undefined,
  });

  res.json({
    success: true,
    data: items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const getUserById = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(String(req.params.id));
  res.json({ success: true, data: user });
});

export const setUserStatus = asyncHandler(async (req, res) => {
  const user = await userService.setUserStatus(String(req.user!._id), String(req.params.id), req.body.isActive);
  res.json({ success: true, data: user });
});
