const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Product = require('../models/Product');
const Order = require('../models/Order');

// Reserves stock for each item one at a time with an atomic conditional
// update (stock only decrements if enough is available). If a later item
// fails, stock already reserved for earlier items is given back.
const createOrder = asyncHandler(async (req, res) => {
  const { items } = req.body;

  const orderItems = [];
  const reserved = [];

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

      reserved.push({ productId, quantity });

      const unitPrice = product.salePrice != null ? product.salePrice : product.price;
      orderItems.push({
        product: product._id,
        name: product.name,
        price: unitPrice,
        quantity,
      });
    }

    const totalAmount = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      totalAmount,
      status: 'Pending',
    });

    res.status(201).json({ success: true, data: order });
  } catch (err) {
    for (const { productId, quantity } of reserved) {
      await Product.updateOne({ _id: productId }, { $inc: { stock: quantity } });
    }
    throw err;
  }
});

const getMyOrders = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.max(parseInt(req.query.limit) || 10, 1);

  const [orders, total] = await Promise.all([
    Order.find({ user: req.user._id })
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit),
    Order.countDocuments({ user: req.user._id }),
  ]);

  res.json({
    success: true,
    data: orders,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) throw new ApiError(404, 'Order not found');

  const isOwner = String(order.user._id) === String(req.user._id);
  if (!isOwner && req.user.role !== 'admin') {
    throw new ApiError(403, 'You do not have access to this order');
  }

  res.json({ success: true, data: order });
});

const listAllOrders = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.max(parseInt(req.query.limit) || 10, 1);

  const filter = {};
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

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!Order.ORDER_STATUSES.includes(status)) {
    throw new ApiError(400, `Status must be one of: ${Order.ORDER_STATUSES.join(', ')}`);
  }

  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found');

  if (['Delivered', 'Cancelled'].includes(order.status)) {
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

module.exports = { createOrder, getMyOrders, getOrderById, listAllOrders, updateOrderStatus };
