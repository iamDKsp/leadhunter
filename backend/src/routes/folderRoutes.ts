import express from 'express';
import { getFolders, createFolder, updateFolder, deleteFolder } from '../controllers/folderController';
import { authenticateToken } from '../middleware/auth';
import { checkPermission } from '../middleware/authorization';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getFolders); // Reading is ok for everyone
router.post('/', checkPermission('canManageFolders'), createFolder);
router.put('/:id', checkPermission('canManageFolders'), updateFolder);
router.delete('/:id', checkPermission('canManageFolders'), deleteFolder);

export default router;
