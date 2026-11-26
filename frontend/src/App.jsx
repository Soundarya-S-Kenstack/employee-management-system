
import React from "react";

import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from "react-router-dom";

import Register from "./components/Register";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import EmployeeManagement from "./components/EmployeeManagement";
import Attendance from "./components/Attendance";
import ProtectedRoute from "./components/ProtectedRoute";
import AddEmployee from "./components/AddEmployee";
import EditEmployee from "./components/EditEmployee";
import Reports from "./components/Reports";


function App() {

    return (

        <BrowserRouter>

            <Routes>

                {/* Default Route */}
                <Route
                    path="/"
                    element={<Navigate to="/register" replace />}
                />

                {/* Registration */}
                <Route
                    path="/register"
                    element={<Register />}
                />

                {/* Login */}
                <Route
                    path="/login"
                    element={<Login />}
                />

                {/* Employee Dashboard */}
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />

                {/* Employee Management - CRUD */}
                <Route
                    path="/employee-management"
                    element={
                        <ProtectedRoute>
                            <EmployeeManagement />
                        </ProtectedRoute>
                    }
                />

                {/* Attendance Management */}
                <Route
                    path="/attendance"
                    element={
                        <ProtectedRoute>
                            <Attendance />
                        </ProtectedRoute>
                    }
                />

                    {/* Add Employee */}
                <Route
                    path="/add-employee"
                    element={
                        <ProtectedRoute>
                            <AddEmployee />
                        </ProtectedRoute>
                    }
                />

                      {/* Add Employee */}
                <Route
                    path="/edit-employee"
                    element={
                        <ProtectedRoute>
                            <EditEmployee />
                        </ProtectedRoute>
                    }
                />

                        {/* reports*/}
                <Route
                    path="/reports"
                    element={
                        <ProtectedRoute>
                            <Reports />
                        </ProtectedRoute>
                    }
                />

                {/* Fallback Route */}
                <Route
                    path="*"
                    element={<Navigate to="/dashboard" replace />}
                />

            </Routes>

        </BrowserRouter>

    );
}

export default App;
