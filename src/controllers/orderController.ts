import asyncHandler from '../utils/asyncHandler';
import * as orderService from '../services/orderService';

export const createOrder = asyncHandler(async (req, res) => {
  const order = await orderService.createOrder(String(req.user!._id), req.body.items);
  res.status(201).json({ success: true, data: order });
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page as string) || 1, 1);
  const limit = Math.max(parseInt(req.query.limit as string) || 10, 1);

  const { items, total } = await orderService.getMyOrders(String(req.user!._id), page, limit);

  res.json({
    success: true,
    data: items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const getOrderById = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderById(String(req.params.id), String(req.user!._id), req.user!.role);
  res.json({ success: true, data: order });
});

export const listAllOrders = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page as string) || 1, 1);
  const limit = Math.max(parseInt(req.query.limit as string) || 10, 1);

  const { items, total } = await orderService.listAllOrders(page, limit, req.query.status as string | undefined);

  res.json({
    success: true,
    data: items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await orderService.updateOrderStatus(String(req.params.id), req.body.status);
  res.json({ success: true, data: order });
});
