import express from 'express';
import validate from '../middlewares/validate';
import { registerSchema, loginSchema } from '../validators/authValidator';
import { register, login, refresh, logout } from '../controllers/authController';

const router = express.Router();

router.post('/register', validate(registerSchema), register);

router.post('/login', validate(loginSchema), login);

router.post('/refresh', refresh);

router.post('/logout', logout);

export default router;
