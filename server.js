import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// ========== MongoDB Connection ==========
const connectDB = async () => {
  try {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ MongoDB Connected');
    } else {
      console.log('⚠️ No MongoDB URI, using in-memory storage');
    }
  } catch (error) {
    console.log('⚠️ MongoDB connection failed, using in-memory storage');
  }
};
connectDB();

// ========== Mongoose Schemas ==========
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: 'member' }
}, { timestamps: true });

const ProjectSchema = new mongoose.Schema({
  name: String,
  description: String,
  createdBy: String,
  members: [String],
  status: { type: String, default: 'active' }
}, { timestamps: true });

const TaskSchema = new mongoose.Schema({
  title: String,
  description: String,
  projectId: String,
  assignedTo: String,
  status: { type: String, default: 'todo' },
  priority: { type: String, default: 'medium' },
  dueDate: Date
}, { timestamps: true });

// ========== Models (or In-Memory Fallback) ==========
let User, Project, Task;
let useDB = false;

try {
  User = mongoose.model('User', UserSchema);
  Project = mongoose.model('Project', ProjectSchema);
  Task = mongoose.model('Task', TaskSchema);
  useDB = mongoose.connection.readyState === 1;
} catch(e) { console.log('Using in-memory storage'); }

// In-memory storage
const memoryUsers = [];
const memoryProjects = [];
const memoryTasks = [];

// ========== Helper Functions ==========
const getUsers = () => useDB ? User : { find: () => ({ exec: async () => memoryUsers }) };
const getProjects = () => useDB ? Project : { find: () => ({ exec: async () => memoryProjects }) };
const getTasks = () => useDB ? Task : { find: () => ({ exec: async () => memoryTasks }) };

// ========== AUTH ROUTES ==========
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    if (useDB) {
      const exists = await User.findOne({ email });
      if (exists) return res.status(400).json({ success: false, message: 'User exists' });
      
      const hashed = await bcrypt.hash(password, 10);
      const user = await User.create({ name, email, password: hashed, role });
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret');
      res.json({ success: true, token, user: { id: user._id, name, email, role } });
    } else {
      const exists = memoryUsers.find(u => u.email === email);
      if (exists) return res.status(400).json({ success: false, message: 'User exists' });
      
      const hashed = await bcrypt.hash(password, 10);
      const user = { id: Date.now().toString(), name, email, password: hashed, role };
      memoryUsers.push(user);
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'secret');
      res.json({ success: true, token, user: { id: user.id, name, email, role } });
    }
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (useDB) {
      const user = await User.findOne({ email });
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret');
      res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } else {
      const user = memoryUsers.find(u => u.email === email);
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'secret');
      res.json({ success: true, token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    }
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ========== VERIFY TOKEN MIDDLEWARE ==========
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'No token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.userId = decoded.id;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// ========== PROJECT ROUTES ==========
app.post('/api/projects', verifyToken, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (useDB) {
      const project = await Project.create({ name, description, createdBy: req.userId, members: [req.userId] });
      res.json({ success: true, data: project });
    } else {
      const project = { _id: Date.now().toString(), name, description, createdBy: req.userId, members: [req.userId], status: 'active' };
      memoryProjects.push(project);
      res.json({ success: true, data: project });
    }
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.get('/api/projects', verifyToken, async (req, res) => {
  try {
    if (useDB) {
      const projects = await Project.find({ members: req.userId });
      res.json({ success: true, data: projects });
    } else {
      const projects = memoryProjects.filter(p => p.members.includes(req.userId));
      res.json({ success: true, data: projects });
    }
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.delete('/api/projects/:id', verifyToken, async (req, res) => {
  try {
    if (useDB) {
      await Project.findByIdAndDelete(req.params.id);
      await Task.deleteMany({ projectId: req.params.id });
    } else {
      const index = memoryProjects.findIndex(p => p._id === req.params.id);
      if (index !== -1) memoryProjects.splice(index, 1);
      const taskIndices = memoryTasks.filter(t => t.projectId === req.params.id);
      taskIndices.forEach(t => memoryTasks.splice(memoryTasks.indexOf(t), 1));
    }
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ========== TASK ROUTES ==========
app.post('/api/tasks', verifyToken, async (req, res) => {
  try {
    const { title, description, projectId, assignedTo, dueDate, priority } = req.body;
    if (useDB) {
      const task = await Task.create({ title, description, projectId, assignedTo, assignedBy: req.userId, dueDate, priority });
      res.json({ success: true, data: task });
    } else {
      const task = { _id: Date.now().toString(), title, description, projectId, assignedTo, assignedBy: req.userId, dueDate, priority, status: 'todo' };
      memoryTasks.push(task);
      res.json({ success: true, data: task });
    }
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.get('/api/tasks', verifyToken, async (req, res) => {
  try {
    if (useDB) {
      const tasks = await Task.find({ assignedTo: req.userId }).populate('projectId', 'name');
      res.json({ success: true, data: tasks });
    } else {
      const tasks = memoryTasks.filter(t => t.assignedTo === req.userId);
      res.json({ success: true, data: tasks });
    }
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.put('/api/tasks/:id/status', verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    if (useDB) {
      await Task.findByIdAndUpdate(req.params.id, { status });
    } else {
      const task = memoryTasks.find(t => t._id === req.params.id);
      if (task) task.status = status;
    }
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.get('/api/tasks/dashboard', verifyToken, async (req, res) => {
  try {
    let tasks = [];
    let projects = [];
    
    if (useDB) {
      tasks = await Task.find({ assignedTo: req.userId });
      projects = await Project.find({ members: req.userId });
    } else {
      tasks = memoryTasks.filter(t => t.assignedTo === req.userId);
      projects = memoryProjects.filter(p => p.members.includes(req.userId));
    }
    
    const stats = {
      totalProjects: projects.length,
      totalTasks: tasks.length,
      todoTasks: tasks.filter(t => t.status === 'todo').length,
      progressTasks: tasks.filter(t => t.status === 'progress').length,
      doneTasks: tasks.filter(t => t.status === 'done').length,
      overdueTasks: tasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== 'done').length
    };
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ========== SERVE FRONTEND ==========
app.use(express.static(path.join(__dirname, '../frontend')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// ========== START SERVER ==========
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`✅ API URL: http://localhost:${PORT}/api`);
  console.log(`📱 Frontend: http://localhost:${PORT}`);
});
