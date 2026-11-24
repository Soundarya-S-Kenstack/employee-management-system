# Employee Management System (EMS)

A full-stack Employee Management System designed to simplify employee information management through a modern web interface, secure authentication, and database integration.

## 🚀 Project Overview

The Employee Management System (EMS) is a web application developed to manage employee-related information efficiently.

The application provides user registration and login functionality, allowing registered users to authenticate before accessing the system. It uses a React frontend, Python FastAPI backend, and PostgreSQL database to handle application data.

## ✨ Key Features

### 🔐 User Authentication
- User registration with input validation.
- Secure login using email and password.
- Password hashing before storing credentials.
- Duplicate email verification during registration.
- JWT-based authentication.
- Logout functionality.

### 👨‍💼 Employee Management
Designed to organize employee information, including:

- Employee ID
- Employee Name
- Official Email
- Contact Number
- Department
- Designation
- Joining Date
- Employment Status (Active/Inactive)

### 🗄️ Database Management
- PostgreSQL database integration.
- Structured database tables for storing user and employee information.
- Database connectivity through SQLAlchemy.

### 🎨 User Interface
- React-based frontend.
- Registration and login pages.
- Form validation and user-friendly error messages.
- Responsive interface.

## 🛠️ Technologies Used

| Technology | Purpose |
|---|---|
| React.js | Frontend development |
| JavaScript | Application functionality |
| HTML5 | Web structure |
| CSS3 | Styling and responsive design |
| Python | Backend development |
| FastAPI | REST API development |
| PostgreSQL | Database management |
| SQLAlchemy | Database interaction |
| JWT | Authentication |
| Argon2 / pwdlib | Password hashing |
| Uvicorn | ASGI server |

## 📂 Project Structure

The project is organized into frontend and backend modules.

```text
soundarya-s-employee-management-system/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   ├── package.json
│   └── index.html
│
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── auth.py
│   └── requirements.txt
│
├── .gitignore
└── README.md
```

*Note: Adjust the folder and file names above to match your actual project structure.*

## 💻 Getting Started

Follow these steps to run the application locally.

### Prerequisites

- Node.js and npm
- Python
- PostgreSQL
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/Soundarya-S-Kenstack/employee-management-system.git
```

### 2. Navigate to the Project Directory

```bash
cd employee-management-system
```

### 3. Set Up the Backend

Navigate to your backend directory:

```bash
cd backend
```

Create a Python virtual environment:

```bash
python -m venv venv
```

Activate the environment on Windows:

```powershell
venv\Scripts\activate
```

Install the required dependencies:

```bash
pip install -r requirements.txt
```

Configure your environment variables in a `.env` file with your PostgreSQL connection details and JWT secret.

Start the FastAPI development server:

```bash
python -m uvicorn main:app --reload
```

Backend URL:

```text
http://127.0.0.1:8000
```

API documentation:

```text
http://127.0.0.1:8000/docs
```

### 4. Set Up the Frontend

Open another terminal and navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the React development server:

```bash
npm run dev
```

Open the local URL displayed in your terminal, usually:

```text
http://localhost:5173
```

## 🔒 Security Considerations

- Passwords should be stored as secure hashes rather than plain text.
- JWT secrets and database credentials should be stored in environment variables.
- Environment files must not be committed to GitHub.
- Authentication should be validated by the backend before protected resources are accessed.

## 🌐 GitHub Repository

[Employee Management System – GitHub](https://github.com/Soundarya-S-Kenstack/employee-management-system)

## 📩 Developer

**Soundarya S.**

GitHub: [Soundarya-S-Kenstack](https://github.com/Soundarya-S-Kenstack)

---

*Employee Management System – Simplifying Employee Information Management Through Technology.*