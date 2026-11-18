import { Router } from 'express';
import { userController } from '../controllers/userController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate, validateQuery, validateParams } from '../middleware/validation.js';
import { paginationSchema, uuidParamSchema } from '../validators/index.js';

const router = Router();

router.use(requireAuth);

router.get('/', validateQuery(paginationSchema), userController.list);
router.get('/me', userController.getMe);
router.get('/:id', validateParams(uuidParamSchema), userController.get);
router.patch('/:id', validateParams(uuidParamSchema), userController.update);
router.delete('/:id', validateParams(uuidParamSchema), userController.delete);

export default router;