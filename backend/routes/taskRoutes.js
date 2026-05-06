import express from 'express';
import { createTask, getTasks, updateTaskStatus, getDashboardStats } from '../controllers/taskController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.get('/dashboard', getDashboardStats);
router.route('/').post(createTask).get(getTasks);
router.put('/:id/status', updateTaskStatus);

export default router;
