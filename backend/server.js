import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========== IN-MEMORY DATABASE (No MongoDB Required) ==========
const users = [];
const projects = [];
const tasks = [];

// ========== AUTHENTICATION ROUTES ==========

// Register
app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Check if user exists
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists with this email' 
      });
    }
    
    // Create new user
    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      password, // In production, hash this!
      role: role || 'member',
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    
    res.status(201).json({
      success: true,
      message: 'Account created successfully! Please login.',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Login
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }
    
    // Generate simple token
    const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');
    
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== AUTH MIDDLEWARE ==========
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false, 
      message: 'No token provided' 
    });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = Buffer.from(token, 'base64').toString();
    const userId = decoded.split(':')[0];
    req.userId = userId;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// ========== PROJECT ROUTES ==========

// Create project
app.post('/api/projects', authMiddleware, (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name || !description) {
      return res.status(400).json({ 
        success: false, 
        message: 'Project name and description are required' 
      });
    }
    
    const project = {
      _id: Date.now().toString(),
      name,
      description,
      createdBy: req.userId,
      members: [req.userId],
      status: 'active',
      createdAt: new Date().toISOString()
    };
    
    projects.push(project);
    
    res.status(201).json({
      success: true,
      data: project
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all projects
app.get('/api/projects', authMiddleware, (req, res) => {
  try {
    const userProjects = projects.filter(p => p.members.includes(req.userId));
    
    res.json({
      success: true,
      data: userProjects
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete project
app.delete('/api/projects/:id', authMiddleware, (req, res) => {
  try {
    const projectIndex = projects.findIndex(p => p._id === req.params.id);
    
    if (projectIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: 'Project not found' 
      });
    }
    
    projects.splice(projectIndex, 1);
    
    // Delete related tasks
    const taskIndices = tasks.filter(t => t.projectId === req.params.id);
    taskIndices.forEach(task => {
      const idx = tasks.findIndex(t => t._id === task._id);
      if (idx !== -1) tasks.splice(idx, 1);
    });
    
    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== TASK ROUTES ==========

// Create task
app.post('/api/tasks', authMiddleware, (req, res) => {
  try {
    const { title, description, projectId, dueDate, priority } = req.body;
    
    if (!title || !description || !projectId || !dueDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'All task fields are required' 
      });
    }
    
    // Check if project exists
    const project = projects.find(p => p._id === projectId);
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: 'Project not found' 
      });
    }
    
    const task = {
      _id: Date.now().toString(),
      title,
      description,
      projectId,
      assignedTo: req.userId,
      assignedBy: req.userId,
      dueDate,
      priority: priority || 'medium',
      status: 'todo',
      createdAt: new Date().toISOString()
    };
    
    tasks.push(task);
    
    res.status(201).json({
      success: true,
      data: task
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all tasks
app.get('/api/tasks', authMiddleware, (req, res) => {
  try {
    const userTasks = tasks.filter(t => t.assignedTo === req.userId);
    
    // Add project name to each task
    const tasksWithProject = userTasks.map(task => {
      const project = projects.find(p => p._id === task.projectId);
      return {
        ...task,
        projectName: project ? project.name : 'Unknown Project'
      };
    });
    
    res.json({
      success: true,
      data: tasksWithProject
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update task status
app.put('/api/tasks/:id/status', authMiddleware, (req, res) => {
  try {
    const { status } = req.body;
    const task = tasks.find(t => t._id === req.params.id);
    
    if (!task) {
      return res.status(404).json({ 
        success: false, 
        message: 'Task not found' 
      });
    }
    
    if (task.assignedTo !== req.userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to update this task' 
      });
    }
    
    task.status = status;
    
    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Dashboard stats
app.get('/api/tasks/dashboard', authMiddleware, (req, res) => {
  try {
    const userTasks = tasks.filter(t => t.assignedTo === req.userId);
    const userProjects = projects.filter(p => p.members.includes(req.userId));
    
    const now = new Date();
    const stats = {
      totalProjects: userProjects.length,
      totalTasks: userTasks.length,
      todoTasks: userTasks.filter(t => t.status === 'todo').length,
      progressTasks: userTasks.filter(t => t.status === 'progress').length,
      doneTasks: userTasks.filter(t => t.status === 'done').length,
      overdueTasks: userTasks.filter(t => {
        return new Date(t.dueDate) < now && t.status !== 'done';
      }).length,
      completionRate: userTasks.length > 0 
        ? ((userTasks.filter(t => t.status === 'done').length / userTasks.length) * 100).toFixed(1)
        : 0
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== HEALTH CHECK ==========
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ========== SERVE FRONTEND ==========
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// Handle all other routes - serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// ========== ERROR HANDLING ==========
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!' 
  });
});

// ========== START SERVER ==========
app.listen(PORT, () => {
  console.log(`\n🚀 ========================================`);
  console.log(`✅ Server is running on port ${PORT}`);
  console.log(`📍 API URL: http://localhost:${PORT}/api`);
  console.log(`📱 Frontend: http://localhost:${PORT}`);
  console.log(`💚 Health Check: http://localhost:${PORT}/health`);
  console.log(`========================================\n`);
});
