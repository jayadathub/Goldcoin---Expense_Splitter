import express from 'express';
import {
  addExpense,
  getGroupExpenses,
  getGroupBalances,
  updateExpense,
  deleteExpense,
} from '../controllers/expenseController.js';
import { protectRoute } from '../middleware/auth.js';

const router = express.Router();

router.use(protectRoute); // All expense routes require authentication

router.post('/', addExpense);
router.get('/group/:groupId', getGroupExpenses);
router.get('/group/:groupId/balances', getGroupBalances);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

export default router;
