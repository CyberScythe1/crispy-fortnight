import { Router } from 'express';
import { workspaceController } from '../controllers/workspaceController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate, validateQuery, validateParams } from '../middleware/validation.js';
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  paginationSchema,
  uuidParamSchema,
} from '../validators/index.js';

const router = Router();

router.use(requireAuth);

router.get('/', validateQuery(paginationSchema), workspaceController.list);
router.post('/', validate(createWorkspaceSchema), workspaceController.create);
router.get('/:id', validateParams(uuidParamSchema), workspaceController.get);
router.patch('/:id', validateParams(uuidParamSchema), validate(updateWorkspaceSchema), workspaceController.update);
router.delete('/:id', validateParams(uuidParamSchema), workspaceController.delete);

router.get('/:id/members', validateParams(uuidParamSchema), workspaceController.getMembers);
router.post('/:id/members', validateParams(uuidParamSchema), workspaceController.addMember);
router.patch('/:id/members/:memberId', validateParams(uuidParamSchema), workspaceController.updateMember);
router.delete('/:id/members/:memberId', validateParams(uuidParamSchema), workspaceController.removeMember);

router.get('/:id/documents', validateParams(uuidParamSchema), validateQuery(paginationSchema), workspaceController.getDocuments);

export default router;