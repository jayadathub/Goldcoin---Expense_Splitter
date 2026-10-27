import express from 'express';
import {
  createGroup,
  getMyGroups,
  getGroupById,
  inviteMember,
  updateGroup,
  getRecentMembers,
  deleteGroup,
} from '../controllers/groupController.js';
import { protectRoute } from '../middleware/auth.js';

const router = express.Router();

router.use(protectRoute); // All group routes require authentication

router.post('/', createGroup);
router.get('/', getMyGroups);
router.get('/recent-members', getRecentMembers);
router.get('/:id', getGroupById);
router.put('/:id', updateGroup);
router.delete('/:id', deleteGroup);
router.post('/:id/invite', inviteMember);

export default router;
