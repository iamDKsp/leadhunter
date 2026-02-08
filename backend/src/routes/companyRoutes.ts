import express from 'express';
import {
    searchCompanies,
    importCompany,
    getCompanies,
    createCompany,
    updateCompany,
    deleteCompany
} from '../controllers/companyController';
import { authenticateToken } from '../middleware/auth';

import { checkPermission } from '../middleware/authorization';

const router = express.Router();

router.use(authenticateToken); // Protect all company routes

router.get('/search', checkPermission('canSearchLeads'), searchCompanies);
router.post('/import', checkPermission('canManageLeads'), importCompany);
router.get('/', getCompanies); // Controller handles filtering based on ViewAll vs ViewOwn
router.post('/', checkPermission('canManageLeads'), createCompany);
router.put('/:id', checkPermission('canManageLeads'), updateCompany);
router.delete('/:id', checkPermission('canManageLeads'), deleteCompany);

export default router;
