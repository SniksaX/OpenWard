// src/routes/apiRoutes.ts
import { Router } from 'express';
import { checkStatus } from '../controllers/statusController';
import { listPeers, syncPeers, addPeer, updatePeer, deletePeer } from '../controllers/peerController';

const router = Router();

router.post('/status', checkStatus);
router.get('/peers', listPeers);
router.get('/peers/sync', syncPeers);
router.post('/peers', addPeer);
router.put('/peers/:publicKey', updatePeer);
router.delete('/peers/:publicKey', deletePeer);

export default router;