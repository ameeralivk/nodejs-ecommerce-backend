const express = require('express');
const { body } = require('express-validator');
const validate = require('../middlewares/validate');
const { protect, authorize } = require('../middlewares/auth');
const {
  getMe,
  updateMe,
  listUsers,
  getUserById,
  setUserStatus,
} = require('../controllers/userController');

const router = express.Router();

router.use(protect);

router.get('/me', getMe);

router.put(
  '/me',
  [body('email').optional().isEmail().withMessage('A valid email is required')],
  validate,
  updateMe
);

router.get('/', authorize('admin'), listUsers);
router.get('/:id', authorize('admin'), getUserById);

router.patch(
  '/:id/status',
  authorize('admin'),
  [body('isActive').isBoolean().withMessage('isActive must be true or false')],
  validate,
  setUserStatus
);

module.exports = router;
