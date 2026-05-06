import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// In-memory storage
const users = [];
const projects = [];
const tasks = [];

// Auth Routes
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, role } = req.body;
  
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ success: false, message: 'User already exists' });
  }
  
  const user = { id: Date.now().toString(), name, email, password, role: role || 'member' };
  users.push(user);
  res.json({ success: true, message: 'Signup successful!' });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
  
  const token = Buffer.from(user.id).toString('base64');
  res.json({ success: true, token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

// Auth Middleware
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'No token' });
  req.userId = Buffer.from(token, 'base64').toString();
  next();
};

// Projects
app.post('/api/projects', auth, (req, res) => {
  const { name, description } = req.body;
  const project = { _id: Date.now().toString(), name, description, createdBy: req.userId, members: [req.userId] };
  projects.push(project);
  res.json({ success: true, data: project });
});

app.get('/api/projects', auth, (req, res) => {
  res.json({ success: true, data: projects.filter(p => p.members.includes(req.userId)) });
});

app.delete('/api/projects/:id', auth, (req, res) => {
  const index = projects.findIndex(p => p._id === req.params.id);
  if (index !== -1) projects.splice(index, 1);
  res.json({ success: true });
});

// Tasks
app.post('/api/tasks', auth, (req, res) => {
  const { title, description, projectId, dueDate, priority } = req.body;
  const task = { _id: Date.now().toString(), title, description, projectId, assignedTo: req.userId, dueDate, priority, status: 'todo' };
  tasks.push(task);
  res.json({ success: true, data: task });
});

app.get('/api/tasks', auth, (req, res) => {
  res.json({ success: true, data: tasks.filter(t => t.assignedTo === req.userId) });
});

app.put('/api/tasks/:id/status', auth, (req, res) => {
  const task = tasks.find(t => t._id === req.params.id);
  if (task) task.status = req.body.status;
  res.json({ success: true });
});

app.get('/api/tasks/dashboard', auth, (req, res) => {
  const userTasks = tasks.filter(t => t.assignedTo === req.userId);
  const userProjects = projects.filter(p => p.members.includes(req.userId));
  
  res.json({ success: true, data: {
    totalProjects: userProjects.length,
    totalTasks: userTasks.length,
    todoTasks: userTasks.filter(t => t.status === 'todo').length,
    progressTasks: userTasks.filter(t => t.status === 'progress').length,
    doneTasks: userTasks.filter(t => t.status === 'done').length,
    overdueTasks: userTasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== 'done').length
  }});
});

// Serve Frontend
app.use(express.static(path.join(__dirname, '../frontend')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
