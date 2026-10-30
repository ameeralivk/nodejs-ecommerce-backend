const express = require('express');
const { body } = require('express-validator');
const validate = require('../middlewares/validate');
const { protect, authorize } = require('../middlewares/auth');
const {
  createCategory,
  updateCategory,
  deleteCategory,
  listCategories,
  getCategoryTree,
  getCategoryById,
} = require('../controllers/categoryController');

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

module.exports = router;
