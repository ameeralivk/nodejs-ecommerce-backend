import express from 'express';
import validate from '../middlewares/validate';
import { protect, authorize } from '../middlewares/auth';
import { createProductSchema, updateProductSchema } from '../validators/productValidator';
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

router.post('/', validate(createProductSchema), createProduct);
router.put('/:id', validate(updateProductSchema), updateProduct);
router.delete('/:id', deleteProduct);

export default router;
