import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// import connectDB from './config/db.js';  // COMMENT KARDO

dotenv.config();
// connectDB();  // COMMENT KARDO

const app = express();
app.use(cors());
app.use(express.json());

// Fake routes for testing
app.post('/api/auth/login', (req, res) => {
  res.json({ success: true, token: 'fake-token', user: { name: 'Test User', email: req.body.email, role: 'admin' } });
});

app.post('/api/auth/register', (req, res) => {
  res.json({ success: true, message: 'User created' });
});

app.get('/api/projects', (req, res) => {
  res.json({ success: true, data: [{ _id: '1', name: 'Demo Project', description: 'Test', createdBy: { name: 'Admin' }, members: [] }] });
});

app.post('/api/projects', (req, res) => {
  res.json({ success: true, data: req.body });
});

app.get('/api/tasks', (req, res) => {
  res.json({ success: true, data: [] });
});

app.post('/api/tasks', (req, res) => {
  res.json({ success: true, data: req.body });
});

app.get('/api/tasks/dashboard', (req, res) => {
  res.json({ success: true, data: { totalProjects: 1, totalTasks: 0, todoTasks: 0, progressTasks: 0, doneTasks: 0, overdueTasks: 0 } });
});

app.delete('/api/projects/:id', (req, res) => {
  res.json({ success: true });
});

app.put('/api/tasks/:id/status', (req, res) => {
  res.json({ success: true });
});

app.post('/api/projects/add-member', (req, res) => {
  res.json({ success: true });
});

app.get('/health', (req, res) => res.json({ status: 'OK' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
