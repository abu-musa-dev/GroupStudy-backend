# Online Group Study Web Application (Backend)

This repository contains the backend API for the Online Group Study web application, built with Node.js, Express.js, MongoDB, and Firebase Authentication. It provides endpoints for user authentication, assignment management, and grading.

## Key Features:
- **JWT Authentication:** Secure login using email/password or social logins (Google/GitHub).
- **Assignment Management:** Endpoints for creating, updating, deleting, and fetching assignments.
- **Grading System:** Allowing evaluators to grade assignments and provide feedback.
- **Protected Routes:** Only authenticated users can access certain routes (using JWT).
- **CORS:** Cross-origin resource sharing configured for frontend integration.

## Technologies Used:
- **Node.js**: JavaScript runtime for building server-side applications.
- **Express.js**: Framework for building web applications and APIs.
- **MongoDB**: NoSQL database for storing assignment data and user information.
- **Mongoose**: ODM (Object Data Modeling) for MongoDB and Node.js.
- **jsonwebtoken (JWT)**: For implementing secure token-based authentication.
- **dotenv**: For loading environment variables securely.
- **CORS**: Middleware for enabling cross-origin requests.
- **Firebase Authentication**: For secure user authentication using Google and GitHub.


