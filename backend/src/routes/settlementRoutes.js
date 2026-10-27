import express from 'express';
import {
  createSettlement,
  getGroupSettlements,
} from '../controllers/settlementController.js';
import { protectRoute } from '../middleware/auth.js';

const router = express.Router();

router.use(protectRoute); // All settlement routes require authentication

router.post('/', createSettlement);
router.get('/group/:groupId', getGroupSettlements);

export default router;
