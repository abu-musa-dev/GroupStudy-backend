# Online Group Study Web Application (Backend)

This repository hosts the backend API for the **Online Group Study Web Application**, designed to support seamless user authentication, assignment management, and grading functionality. Built using **Node.js**, **Express.js**, **MongoDB**, and **Firebase Authentication**, this API provides robust, secure, and scalable endpoints for managing user accounts, assignments, and evaluations.

### **Live Site (Frontend)**
[View the Live Site](https://groupstudy-web.netlify.app/)

## 🚀 **Key Features**
- **JWT Authentication**: Implemented secure authentication via **email/password** or **social logins** (Google/GitHub) using **JWT tokens**.
- **Assignment Management**: Endpoints to **create**, **update**, **delete**, and **fetch** assignments. Facilitates smooth assignment handling for both students and evaluators.
- **Grading System**: Allows evaluators to **grade assignments** and provide **real-time feedback**, streamlining the evaluation process.
- **Protected Routes**: Certain routes are **protected** and require authentication, ensuring **secure access** for authorized users only.
- **CORS Configuration**: **Cross-Origin Resource Sharing (CORS)** is enabled for seamless integration between frontend and backend services.

## 🔧 **Technologies Used**
- **Node.js**: A powerful JavaScript runtime for building scalable and high-performance server-side applications.
- **Express.js**: A minimal and flexible web application framework that simplifies routing and middleware handling.
- **MongoDB**: A NoSQL database for storing user data, assignments, and feedback in a flexible, document-based format.
- **Mongoose**: Object Data Modeling (ODM) library for MongoDB and Node.js, providing a straight-forward solution for interacting with MongoDB.
- **jsonwebtoken (JWT)**: Used for creating and validating **JSON Web Tokens** to handle secure, stateless user authentication.
- **dotenv**: Loads environment variables securely, ensuring sensitive information like API keys and credentials are not hard-coded.
- **CORS Middleware**: Facilitates the integration between the frontend and backend by enabling cross-origin HTTP requests.
- **Firebase Authentication**: Simplifies user authentication with **Google** and **GitHub** login systems, providing secure login management.

## ⚙️ **Installation & Setup**
1. Clone the repository:
   ```bash
   git clone https://github.com/abu-musa-dev/GroupStudy-backend.git
