import express from 'express';
import {
  createCluster,
  getMyClusters,
  getClusterById,
  getClusterBalances,
  updateCluster,
  deleteCluster,
} from '../controllers/clusterController.js';
import { protectRoute } from '../middleware/auth.js';

const router = express.Router();

router.use(protectRoute);

router.post('/', createCluster);
router.get('/', getMyClusters);
router.get('/:id', getClusterById);
router.get('/:id/balances', getClusterBalances);
router.put('/:id', updateCluster);
router.delete('/:id', deleteCluster);

export default router;
