import express from 'express';
import validate from '../middlewares/validate';
import { protect, authorize } from '../middlewares/auth';
import { createCategorySchema, updateCategorySchema } from '../validators/categoryValidator';
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

router.post('/', validate(createCategorySchema), createCategory);

router.put('/:id', validate(updateCategorySchema), updateCategory);

router.delete('/:id', deleteCategory);

export default router;
