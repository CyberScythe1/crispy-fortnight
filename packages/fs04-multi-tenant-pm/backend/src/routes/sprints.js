import { Router } from 'express';
import { sprintController } from '../controllers/sprintController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate, validateQuery, validateParams } from '../middleware/validation.js';
import {
  createSprintSchema,
  updateSprintSchema,
  paginationSchema,
  projectUuidParamSchema,
  sprintUuidParamSchema,
} from '../validators/index.js';

const router = Router();

router.use(requireAuth);

router.get('/:projectId/sprints', validateParams(projectUuidParamSchema), validateQuery(paginationSchema), sprintController.list);
router.post('/:projectId/sprints', requireRole('OWNER', 'ADMIN'), validateParams(projectUuidParamSchema), validate(createSprintSchema), sprintController.create);
router.get('/:projectId/sprints/:sprintId', validateParams(sprintUuidParamSchema), sprintController.get);
router.patch('/:projectId/sprints/:sprintId', requireRole('OWNER', 'ADMIN'), validateParams(sprintUuidParamSchema), validate(updateSprintSchema), sprintController.update);
router.delete('/:projectId/sprints/:sprintId', requireRole('OWNER', 'ADMIN'), validateParams(sprintUuidParamSchema), sprintController.delete);

router.post('/:projectId/sprints/:sprintId/start', requireRole('OWNER', 'ADMIN'), validateParams(sprintUuidParamSchema), sprintController.start);
router.post('/:projectId/sprints/:sprintId/complete', requireRole('OWNER', 'ADMIN'), validateParams(sprintUuidParamSchema), sprintController.complete);
router.get('/:projectId/sprints/:sprintId/issues', validateParams(sprintUuidParamSchema), sprintController.getIssues);

export default router;