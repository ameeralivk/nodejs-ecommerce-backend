import express from 'express';
import { body } from 'express-validator';
import validate from '../middlewares/validate';
import { protect, authorize } from '../middlewares/auth';
import { getMe, updateMe, listUsers, getUserById, setUserStatus } from '../controllers/userController';

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

export default router;
