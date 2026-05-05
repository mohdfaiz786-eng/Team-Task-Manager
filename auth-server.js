const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Fake users database
const users = [
    { id: 1, name: 'Test User', email: 'test@test.com', password: '123456', role: 'member' },
    { id: 2, name: 'Admin', email: 'admin@admin.com', password: 'admin123', role: 'admin' }
];

// Login
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);
    
    if(user) {
        const token = jwt.sign({ id: user.id, email: user.email }, 'secret123');
        res.json({ success: true, token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials. Use test@test.com / 123456' });
    }
});

// Register
app.post('/api/auth/register', (req, res) => {
    const { name, email, password } = req.body;
    const newUser = { id: users.length + 1, name, email, password, role: 'member' };
    users.push(newUser);
    res.json({ success: true, message: 'User created successfully!' });
});

// Get projects
app.get('/api/projects', (req, res) => {
    res.json({ success: true, data: [
        { id: 1, name: 'Demo Project', description: 'This is a test project', status: 'active', priority: 'high' }
    ] });
});

// Get tasks
app.get('/api/tasks', (req, res) => {
    res.json({ success: true, data: [
        { id: 1, title: 'Demo Task', description: 'Test task', status: 'pending', dueDate: new Date() }
    ] });
});

// Dashboard stats
app.get('/api/tasks/dashboard', (req, res) => {
    res.json({ success: true, data: {
        totalProjects: 1,
        completedTasks: 0,
        pendingTasks: 1,
        completionRate: 0
    } });
});

// Create project
app.post('/api/projects', (req, res) => {
    res.json({ success: true, message: 'Project created!' });
});

app.listen(3000, () => console.log('✅ Auth server running on http://localhost:3000'));