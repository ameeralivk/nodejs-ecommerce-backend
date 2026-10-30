import ApiError from '../utils/ApiError';
import Product from '../models/Product';
import Order from '../models/Order';
import { ORDER_STATUSES, OrderStatus, IOrder, IOrderItem, OrderItemInput } from '../types/order.types';
import { PaginatedResult } from '../types/common.types';

// Reserves stock for each item one at a time with an atomic conditional
// update (stock only decrements if enough is available). If a later item
// fails, stock already reserved for earlier items is given back.
export const createOrder = async (userId: string, items: OrderItemInput[]): Promise<IOrder> => {
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

    return await Order.create({
      user: userId,
      items: orderItems,
      totalAmount,
      status: 'Pending',
    } as any);
  } catch (err) {
    for (const { product: productId, quantity } of reserved) {
      await Product.updateOne({ _id: productId }, { $inc: { stock: quantity } });
    }
    throw err;
  }
};

export const getMyOrders = async (
  userId: string,
  page: number,
  limit: number
): Promise<PaginatedResult<IOrder>> => {
  const [items, total] = await Promise.all([
    Order.find({ user: userId })
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit),
    Order.countDocuments({ user: userId }),
  ]);

  return { items, total };
};

export const getOrderById = async (id: string, requesterId: string, requesterRole: string): Promise<IOrder> => {
  const order = await Order.findById(id).populate('user', 'name email');
  if (!order) throw new ApiError(404, 'Order not found');

  const isOwner = String((order.user as any)._id) === String(requesterId);
  if (!isOwner && requesterRole !== 'admin') {
    throw new ApiError(403, 'You do not have access to this order');
  }

  return order;
};

export const listAllOrders = async (
  page: number,
  limit: number,
  status?: string
): Promise<PaginatedResult<IOrder>> => {
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;

  const [items, total] = await Promise.all([
    Order.find(filter)
      .populate('user', 'name email')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  return { items, total };
};

export const updateOrderStatus = async (id: string, status: OrderStatus): Promise<IOrder> => {
  if (!ORDER_STATUSES.includes(status)) {
    throw new ApiError(400, `Status must be one of: ${ORDER_STATUSES.join(', ')}`);
  }

  const order = await Order.findById(id);
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
  return order;
};
