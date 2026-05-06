const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Users database (memory mein store hoga)
const users = [];

// Login API
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    console.log('Login attempt:', email, password);
    
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        res.json({
            success: true,
            token: 'fake-token-123',
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });
    } else {
        res.status(401).json({
            success: false,
            message: 'Invalid credentials! Use email: test@test.com, password: 123456'
        });
    }
});

// Signup API
app.post('/api/auth/register', (req, res) => {
    const { name, email, password } = req.body;
    console.log('Signup attempt:', name, email);
    
    // Check if user exists
    if (users.find(u => u.email === email)) {
        return res.status(400).json({
            success: false,
            message: 'User already exists!'
        });
    }
    
    // Create new user
    const newUser = {
        id: users.length + 1,
        name,
        email,
        password,
        role: 'member'
    };
    users.push(newUser);
    
    console.log('Users:', users);
    
    res.json({
        success: true,
        message: 'User created successfully! Please login.'
    });
});

// Get projects
app.get('/api/projects', (req, res) => {
    res.json({
        success: true,
        data: [
            { id: 1, name: 'Demo Project', description: 'This is a test project', status: 'active', priority: 'high' }
        ]
    });
});

// Create project
app.post('/api/projects', (req, res) => {
    res.json({
        success: true,
        message: 'Project created successfully!',
        data: req.body
    });
});

// Get tasks
app.get('/api/tasks', (req, res) => {
    res.json({
        success: true,
        data: [
            { id: 1, title: 'Test Task', description: 'Complete the project', status: 'pending', dueDate: new Date() }
        ]
    });
});

// Dashboard stats
app.get('/api/tasks/dashboard', (req, res) => {
    res.json({
        success: true,
        data: {
            totalProjects: 1,
            completedTasks: 0,
            pendingTasks: 1,
            completionRate: '0'
        }
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running!' });
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📍 Login: http://localhost:${PORT}/api/auth/login`);
    console.log(`💚 Health: http://localhost:${PORT}/health`);
});
