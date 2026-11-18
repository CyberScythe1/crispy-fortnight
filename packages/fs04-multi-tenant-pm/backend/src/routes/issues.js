import { Router } from 'express';
import { issueController } from '../controllers/issueController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate, validateQuery, validateParams } from '../middleware/validation.js';
import {
  createIssueSchema,
  updateIssueSchema,
  issueQuerySchema,
  projectUuidParamSchema,
  issueUuidParamSchema,
} from '../validators/index.js';

const router = Router();

router.use(requireAuth);

router.get('/:projectId/issues', validateParams(projectUuidParamSchema), validateQuery(issueQuerySchema), issueController.listByProject);
router.post('/:projectId/issues', validateParams(projectUuidParamSchema), validate(createIssueSchema), issueController.create);
router.get('/:projectId/issues/:issueId', validateParams(issueUuidParamSchema), issueController.get);
router.patch('/:projectId/issues/:issueId', validateParams(issueUuidParamSchema), validate(updateIssueSchema), issueController.update);
router.delete('/:projectId/issues/:issueId', validateParams(issueUuidParamSchema), issueController.delete);

router.get('/:projectId/issues/:issueId/comments', validateParams(issueUuidParamSchema), issueController.getComments);
router.post('/:projectId/issues/:issueId/comments', validateParams(issueUuidParamSchema), issueController.addComment);

router.patch('/:projectId/issues/:issueId/assign', validateParams(issueUuidParamSchema), issueController.assign);
router.patch('/:projectId/issues/:issueId/transition', validateParams(issueUuidParamSchema), issueController.transition);

export default router;