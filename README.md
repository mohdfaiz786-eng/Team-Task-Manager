# 📊 Team Task Manager - Full Stack Application

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Node.js](https://img.shields.io/badge/Node.js-20.x-green)
![MongoDB](https://img.shields.io/badge/MongoDB-8.x-brightgreen)
![License](https://img.shields.io/badge/license-MIT-orange)

## 🚀 Live Demo
[View Live Application](#) *(Add your Railway URL here after deployment)*

## 📋 Project Overview

A **complete full-stack team task management application** where users can create projects, assign tasks, track progress, and manage team members with role-based access control (Admin/Member).

### 🎯 Key Features

| Feature | Description |
|---------|-------------|
| 🔐 **Authentication** | JWT-based signup/login with secure password hashing |
| 👥 **Role-Based Access** | Admin (full control) & Member (assigned tasks only) |
| 📁 **Project Management** | Create, view, and delete projects |
| ✅ **Task Management** | Create tasks with due dates, priorities, and status |
| 👤 **Team Management** | Admins can add/remove team members |
| 📊 **Dashboard** | Real-time stats: total tasks, completion rate, overdue tasks |
| 📱 **Responsive Design** | Mobile-friendly UI |
| 🗄️ **Database** | MongoDB for persistent data storage |

## 🛠️ Tech Stack

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (JSON Web Tokens)
- **Password Encryption:** bcryptjs

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Flexbox/Grid, responsive design
- **JavaScript (ES6+)** - Async/await, Fetch API

### DevOps
- **Version Control:** Git & GitHub
- **Deployment:** Railway

## 📁 Project Structure
team-task-manager/
├── backend/
│ ├── config/
│ │ └── db.js # Database connection
│ ├── models/
│ │ ├── User.js # User schema
│ │ ├── Project.js # Project schema
│ │ └── Task.js # Task schema
│ ├── controllers/
│ │ ├── authController.js # Auth logic
│ │ ├── projectController.js
│ │ └── taskController.js
│ ├── routes/
│ │ ├── authRoutes.js
│ │ ├── projectRoutes.js
│ │ └── taskRoutes.js
│ ├── middleware/
│ │ ├── auth.js # JWT verification
│ │ └── rbac.js # Role-based access
│ ├── .env # Environment variables
│ ├── server.js # Entry point
│ └── package.json
└── frontend/
└── index.html # Single page application
