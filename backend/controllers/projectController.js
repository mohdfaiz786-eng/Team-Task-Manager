import Project from '../models/Project.js';
import Task from '../models/Task.js';
import User from '../models/User.js';

export const createProject = async (req, res) => {
  try {
    const { name, description } = req.body;
    const project = await Project.create({
      name,
      description,
      createdBy: req.user.id,
      members: [req.user.id]
    });
    res.status(201).json({ success: true, data: project });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [{ createdBy: req.user.id }, { members: req.user.id }]
    }).populate('createdBy', 'name email').populate('members', 'name email');
    res.json({ success: true, data: projects });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const addMember = async (req, res) => {
  try {
    const { projectId, email } = req.body;
    const project = await Project.findById(projectId);
    const user = await User.findOne({ email });
    
    if (!project || !user) {
      return res.status(404).json({ success: false, message: 'Project or user not found' });
    }
    
    if (project.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admin can add members' });
    }
    
    if (!project.members.includes(user._id)) {
      project.members.push(user._id);
      await project.save();
    }
    
    res.json({ success: true, data: project });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    await Task.deleteMany({ projectId: project._id });
    await project.deleteOne();
    res.json({ success: true, message: 'Project deleted' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
