import express from 'express';
import { body } from 'express-validator';
import validate from '../middlewares/validate';
import { protect, authorize } from '../middlewares/auth';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  listAllOrders,
  updateOrderStatus,
} from '../controllers/orderController';

const router = express.Router();

router.use(protect);

router.post(
  '/',
  [
    body('items').isArray({ min: 1 }).withMessage('Order must contain at least one item'),
    body('items.*.product').isMongoId().withMessage('Each item needs a valid product id'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  ],
  validate,
  createOrder
);

router.get('/my', getMyOrders);
router.get('/', authorize('admin'), listAllOrders);
router.get('/:id', getOrderById);

router.patch(
  '/:id/status',
  authorize('admin'),
  [body('status').notEmpty().withMessage('Status is required')],
  validate,
  updateOrderStatus
);

export default router;
