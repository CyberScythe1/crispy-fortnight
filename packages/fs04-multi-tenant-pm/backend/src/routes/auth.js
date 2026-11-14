import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { validate } from '../middleware/validation.js';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
} from '../validators/index.js';

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshTokenSchema), authController.refresh);
router.get('/me', authController.me);
router.post('/logout', authController.logout);

export default router;