import asyncHandler from '../utils/asyncHandler';
import ApiError from '../utils/ApiError';
import Product from '../models/Product';
import Order, { ORDER_STATUSES, OrderStatus, IOrderItem } from '../models/Order';

interface OrderItemInput {
  product: string;
  quantity: number;
}

// Reserves stock for each item one at a time with an atomic conditional
// update (stock only decrements if enough is available). If a later item
// fails, stock already reserved for earlier items is given back.
export const createOrder = asyncHandler(async (req, res) => {
  const items: OrderItemInput[] = req.body.items;

  const orderItems: IOrderItem[] = [];
  const reserved: OrderItemInput[] = [];

  try {
    for (const { product: productId, quantity } of items) {
      const product = await Product.findOneAndUpdate(
        { _id: productId, status: 'active', stock: { $gte: quantity } },
        { $inc: { stock: -quantity } },
        { new: true }
      );

      if (!product) {
        const existing = await Product.findById(productId);
        if (!existing) throw new ApiError(404, `Product not found: ${productId}`);
        throw new ApiError(400, `Insufficient stock for product: ${existing.name}`);
      }

      reserved.push({ product: productId, quantity });

      const unitPrice = product.salePrice != null ? product.salePrice : product.price;
      orderItems.push({
        product: product._id as any,
        name: product.name,
        price: unitPrice,
        quantity,
      });
    }

    const totalAmount = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const order = await Order.create({
      user: req.user!._id,
      items: orderItems,
      totalAmount,
      status: 'Pending',
    });

    res.status(201).json({ success: true, data: order });
  } catch (err) {
    for (const { product: productId, quantity } of reserved) {
      await Product.updateOne({ _id: productId }, { $inc: { stock: quantity } });
    }
    throw err;
  }
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page as string) || 1, 1);
  const limit = Math.max(parseInt(req.query.limit as string) || 10, 1);

  const [orders, total] = await Promise.all([
    Order.find({ user: req.user!._id })
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit),
    Order.countDocuments({ user: req.user!._id }),
  ]);

  res.json({
    success: true,
    data: orders,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) throw new ApiError(404, 'Order not found');

  const isOwner = String((order.user as any)._id) === String(req.user!._id);
  if (!isOwner && req.user!.role !== 'admin') {
    throw new ApiError(403, 'You do not have access to this order');
  }

  res.json({ success: true, data: order });
});

export const listAllOrders = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page as string) || 1, 1);
  const limit = Math.max(parseInt(req.query.limit as string) || 10, 1);

  const filter: Record<string, unknown> = {};
  if (req.query.status) filter.status = req.query.status;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('user', 'name email')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: orders,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const status: OrderStatus = req.body.status;

  if (!ORDER_STATUSES.includes(status)) {
    throw new ApiError(400, `Status must be one of: ${ORDER_STATUSES.join(', ')}`);
  }

  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found');

  if (order.status === 'Delivered' || order.status === 'Cancelled') {
    throw new ApiError(400, `Order is already ${order.status} and cannot be updated`);
  }

  if (status === 'Cancelled') {
    for (const item of order.items) {
      await Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } });
    }
  }

  order.status = status;
  await order.save();
  res.json({ success: true, data: order });
});
