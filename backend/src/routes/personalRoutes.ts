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

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Metrics & Data
router.get('/metrics', getMetrics);
router.get('/hot-leads', getHotLeads);
router.get('/performance', getPerformance);

// Tasks
router.get('/tasks', getTasks);
router.post('/tasks', createTask);
router.patch('/tasks/:id', updateTask);
router.delete('/tasks/:id', deleteTask);

// Goals
router.get('/goals', getGoals);
router.patch('/goals/:id', updateGoal);

// Activity
router.get('/activity', getActivity);
router.post('/activity', createActivity);

export default router;
