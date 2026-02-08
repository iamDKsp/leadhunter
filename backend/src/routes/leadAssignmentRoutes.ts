import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { checkPermission } from '../middleware/authorization';
import {
    assignLead,
    unassignLead,
    bulkAssignLeads,
    getMyLeads,
    getLeadsByUser,
    getUnassignedLeads,
    getLeadAssignmentHistory,
    getSellers
} from '../controllers/leadAssignmentController';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Lead assignment routes
router.post('/:id/assign', checkPermission('canAssignLeads'), assignLead);
router.delete('/:id/assign', checkPermission('canAssignLeads'), unassignLead);
router.post('/bulk-assign', checkPermission('canAssignLeads'), bulkAssignLeads);

// Get leads by assignment
router.get('/my-leads', getMyLeads); // Anyone can get their own leads
router.get('/by-user/:userId', checkPermission('canViewAllLeads'), getLeadsByUser);
router.get('/unassigned', checkPermission('canAssignLeads'), getUnassignedLeads);

// History and sellers
router.get('/:id/history', getLeadAssignmentHistory);
router.get('/sellers/list', getSellers);

export default router;
