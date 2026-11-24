
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
import ProtectedRoute from "./components/ProtectedRoute";


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
