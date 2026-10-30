import express from 'express';
import validate from '../middlewares/validate';
import { protect, authorize } from '../middlewares/auth';
import { updateMeSchema, setUserStatusSchema } from '../validators/userValidator';
import { getMe, updateMe, listUsers, getUserById, setUserStatus } from '../controllers/userController';

const router = express.Router();

router.use(protect);

router.get('/me', getMe);

router.put('/me', validate(updateMeSchema), updateMe);

router.get('/', authorize('admin'), listUsers);
router.get('/:id', authorize('admin'), getUserById);

router.patch('/:id/status', authorize('admin'), validate(setUserStatusSchema), setUserStatus);

export default router;
