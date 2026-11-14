import { Router } from 'express';
import { projectController } from '../controllers/projectController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate, validateQuery, validateParams } from '../middleware/validation.js';
import {
  createProjectSchema,
  updateProjectSchema,
  paginationSchema,
  uuidParamSchema,
} from '../validators/index.js';

const router = Router();

router.use(requireAuth);

router.get('/', validateQuery(paginationSchema), projectController.list);
router.post('/', requireRole('OWNER', 'ADMIN'), validate(createProjectSchema), projectController.create);
router.get('/:id', validateParams(uuidParamSchema), projectController.get);
router.patch('/:id', requireRole('OWNER', 'ADMIN'), validateParams(uuidParamSchema), validate(updateProjectSchema), projectController.update);
router.delete('/:id', requireRole('OWNER'), validateParams(uuidParamSchema), projectController.delete);

router.get('/:id/members', validateParams(uuidParamSchema), projectController.getMembers);
router.post('/:id/members', requireRole('OWNER', 'ADMIN'), validateParams(uuidParamSchema), projectController.addMember);
router.patch('/:id/members/:memberId', requireRole('OWNER', 'ADMIN'), validateParams(uuidParamSchema), projectController.updateMember);
router.delete('/:id/members/:memberId', requireRole('OWNER', 'ADMIN'), validateParams(uuidParamSchema), projectController.removeMember);

router.get('/:id/issues', validateParams(uuidParamSchema), projectController.getIssues);
router.get('/:id/sprints', validateParams(uuidParamSchema), projectController.getSprints);
router.get('/:id/boards', validateParams(uuidParamSchema), projectController.getBoards);

export default router;