import { Router } from 'express';
import { documentController } from '../controllers/documentController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate, validateQuery, validateParams } from '../middleware/validation.js';
import {
  createDocumentSchema,
  updateDocumentSchema,
  paginationSchema,
  uuidParamSchema,
} from '../validators/index.js';

const router = Router();

router.use(requireAuth);

router.get('/:workspaceId/documents', validateParams(uuidParamSchema), validateQuery(paginationSchema), documentController.list);
router.post('/:workspaceId/documents', validateParams(uuidParamSchema), validate(createDocumentSchema), documentController.create);
router.get('/:workspaceId/documents/:documentId', validateParams(uuidParamSchema), documentController.get);
router.patch('/:workspaceId/documents/:documentId', validateParams(uuidParamSchema), validate(updateDocumentSchema), documentController.update);
router.delete('/:workspaceId/documents/:documentId', validateParams(uuidParamSchema), documentController.delete);

router.get('/:workspaceId/documents/:documentId/pages', validateParams(uuidParamSchema), documentController.getPages);
router.post('/:workspaceId/documents/:documentId/pages', validateParams(uuidParamSchema), documentController.createPage);

export default router;