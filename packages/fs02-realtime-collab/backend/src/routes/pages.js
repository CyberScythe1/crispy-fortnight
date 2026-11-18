import { Router } from 'express';
import { pageController } from '../controllers/pageController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate, validateParams } from '../middleware/validation.js';
import {
  createPageSchema,
  updatePageSchema,
  uuidParamSchema,
} from '../validators/index.js';

const router = Router();

router.use(requireAuth);

router.get('/:documentId/pages', validateParams(uuidParamSchema), pageController.list);
router.post('/:documentId/pages', validateParams(uuidParamSchema), validate(createPageSchema), pageController.create);
router.get('/:documentId/pages/:pageId', validateParams(uuidParamSchema), pageController.get);
router.patch('/:documentId/pages/:pageId', validateParams(uuidParamSchema), validate(updatePageSchema), pageController.update);
router.delete('/:documentId/pages/:pageId', validateParams(uuidParamSchema), pageController.delete);

export default router;