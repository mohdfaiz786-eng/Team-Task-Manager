import express from 'express';
import { createProject, getProjects, addMember, deleteProject } from '../controllers/projectController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.route('/').post(createProject).get(getProjects);
router.post('/add-member', authorize('admin'), addMember);
router.delete('/:id', authorize('admin'), deleteProject);

export default router;
