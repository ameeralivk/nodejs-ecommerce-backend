import express from 'express';
import { body } from 'express-validator';
import validate from '../middlewares/validate';
import { protect, authorize } from '../middlewares/auth';
import {
  createProduct,
  updateProduct,
  deleteProduct,
  listProducts,
  getProductById,
} from '../controllers/productController';

const router = express.Router();

router.get('/', listProducts);
router.get('/:id', getProductById);

router.use(protect, authorize('admin'));

const createRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('sku').trim().notEmpty().withMessage('SKU is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('salePrice').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Sale price must be a positive number'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('category').isMongoId().withMessage('A valid category id is required'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Status must be active or inactive'),
];

const updateRules = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('sku').optional().trim().notEmpty().withMessage('SKU cannot be empty'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('salePrice').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Sale price must be a positive number'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('category').optional().isMongoId().withMessage('A valid category id is required'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Status must be active or inactive'),
];

router.post('/', createRules, validate, createProduct);
router.put('/:id', updateRules, validate, updateProduct);
router.delete('/:id', deleteProduct);

export default router;
