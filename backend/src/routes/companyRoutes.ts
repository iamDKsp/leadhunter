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

const router = express.Router();

router.use(authenticateToken); // Protect all company routes

router.get('/search', searchCompanies);
router.post('/import', importCompany);
router.get('/', getCompanies);
router.post('/', createCompany);
router.put('/:id', updateCompany);
router.delete('/:id', deleteCompany);

export default router;
