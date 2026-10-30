import express from 'express';
import { body } from 'express-validator';
import validate from '../middlewares/validate';
import { protect, authorize } from '../middlewares/auth';
import {
  createCategory,
  updateCategory,
  deleteCategory,
  listCategories,
  getCategoryTree,
  getCategoryById,
} from '../controllers/categoryController';

const router = express.Router();

router.get('/', listCategories);
router.get('/tree', getCategoryTree);
router.get('/:id', getCategoryById);

router.use(protect, authorize('admin'));

router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('parent').optional({ nullable: true }).isMongoId().withMessage('Invalid parent category id'),
  ],
  validate,
  createCategory
);

router.put(
  '/:id',
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('parent').optional({ nullable: true }).isMongoId().withMessage('Invalid parent category id'),
  ],
  validate,
  updateCategory
);

router.delete('/:id', deleteCategory);

export default router;
