import Task from '../models/Task.js';
import Project from '../models/Project.js';

export const createTask = async (req, res) => {
  try {
    const { title, description, projectId, assignedTo, dueDate, priority } = req.body;
    
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    const task = await Task.create({
      title, description, projectId, assignedTo, assignedBy: req.user.id, dueDate, priority
    });
    
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user.id })
      .populate('projectId', 'name')
      .populate('assignedTo', 'name email')
      .sort('-createdAt');
    res.json({ success: true, data: tasks });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    
    if (task.assignedTo.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    task.status = status;
    await task.save();
    res.json({ success: true, data: task });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user.id });
    const projects = await Project.find({
      $or: [{ createdBy: req.user.id }, { members: req.user.id }]
    });
    
    const now = new Date();
    const stats = {
      totalProjects: projects.length,
      totalTasks: tasks.length,
      todoTasks: tasks.filter(t => t.status === 'todo').length,
      progressTasks: tasks.filter(t => t.status === 'progress').length,
      doneTasks: tasks.filter(t => t.status === 'done').length,
      overdueTasks: tasks.filter(t => t.dueDate < now && t.status !== 'done').length,
      tasksByUser: {
        total: tasks.length,
        completed: tasks.filter(t => t.status === 'done').length
      }
    };
    
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
