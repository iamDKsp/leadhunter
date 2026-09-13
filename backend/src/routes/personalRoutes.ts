import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
    getMetrics,
    getHotLeads,
    getTasks,
    createTask,
    updateTask,
    deleteTask,
    getGoals,
    updateGoal,
    getActivity,
    createActivity,
    getPerformance,
} from '../controllers/personalController';
import { checkPermission } from '../middleware/authorization';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Metrics & Data
router.get('/metrics', checkPermission('canViewPersonal'), getMetrics);
router.get('/hot-leads', checkPermission('canViewPersonal'), getHotLeads);
router.get('/performance', checkPermission('canViewPersonal'), getPerformance);

// Tasks
router.get('/tasks', checkPermission('canManageTasks'), getTasks);
router.post('/tasks', checkPermission('canManageTasks'), createTask);
router.patch('/tasks/:id', checkPermission('canManageTasks'), updateTask);
router.delete('/tasks/:id', checkPermission('canManageTasks'), deleteTask);

// Goals
router.get('/goals', checkPermission('canManageGoals'), getGoals);
router.patch('/goals/:id', checkPermission('canManageGoals'), updateGoal);

// Activity
router.get('/activity', checkPermission('canViewPersonal'), getActivity);
router.post('/activity', checkPermission('canViewPersonal'), createActivity);

export default router;
