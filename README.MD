# SkillHub

SkillHub is an online learning platform built with **Node.js, Express, MongoDB, and JWT authentication**. It allows users to register, login, create courses, add lessons, and manage learning content. Admins and instructors have different permissions.

## Features

- User authentication & authorization (Admin, Instructor, Student)
- Create, update, delete courses
- Add lessons to courses
- Enroll students in courses
- JWT-based token authentication
- Logging for key actions (create/update/delete)
- RESTful API design

## Tech Stack

- Backend: Node.js, Express.js
- Database: MongoDB with Mongoose
- Authentication: JWT
- Logging: Custom logger with fs module
- Validation: express-validator (if used)
- Tools: Postman for testing, nodemon for development

## Folder Structure

src/
├── config/
├── controllers/
├── models/
├── routes/
├── services/
├── middleware/
└── utils/
