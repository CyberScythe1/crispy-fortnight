import { Router } from 'express';
import { documentController } from '../controllers/documentController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate, validateQuery, validateParams } from '../middleware/validation.js';
import {
  createDocumentSchema,
  updateDocumentSchema,
  paginationSchema,
  workspaceParamSchema,
  documentParamSchema,
} from '../validators/index.js';

const router = Router();

router.use(requireAuth);

router.get('/documents', validateQuery(paginationSchema), documentController.listAll);

router.get('/:workspaceId/documents', validateParams(workspaceParamSchema), validateQuery(paginationSchema), documentController.list);
router.post('/:workspaceId/documents', validateParams(workspaceParamSchema), validate(createDocumentSchema), documentController.create);
router.get('/:workspaceId/documents/:documentId', validateParams(workspaceParamSchema.extend(documentParamSchema.shape)), documentController.get);
router.patch('/:workspaceId/documents/:documentId', validateParams(workspaceParamSchema.extend(documentParamSchema.shape)), validate(updateDocumentSchema), documentController.update);
router.delete('/:workspaceId/documents/:documentId', validateParams(workspaceParamSchema.extend(documentParamSchema.shape)), documentController.delete);

router.get('/:workspaceId/documents/:documentId/pages', validateParams(workspaceParamSchema.extend(documentParamSchema.shape)), documentController.getPages);
router.post('/:workspaceId/documents/:documentId/pages', validateParams(workspaceParamSchema.extend(documentParamSchema.shape)), documentController.createPage);

export default router;