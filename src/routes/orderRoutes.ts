import express from 'express';
import validate from '../middlewares/validate';
import { protect, authorize } from '../middlewares/auth';
import { createOrderSchema, updateOrderStatusSchema } from '../validators/orderValidator';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  listAllOrders,
  updateOrderStatus,
} from '../controllers/orderController';

const router = express.Router();

router.use(protect);

router.post('/', validate(createOrderSchema), createOrder);

router.get('/my', getMyOrders);
router.get('/', authorize('admin'), listAllOrders);
router.get('/:id', getOrderById);

router.patch('/:id/status', authorize('admin'), validate(updateOrderStatusSchema), updateOrderStatus);

export default router;
