
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useLocation, Link } from "react-router-dom";
import "../App.css";

function Login() {
    const navigate = useNavigate();
    const location = useLocation();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm();

const [showSuccess, setShowSuccess] = useState(false);
const [showError, setShowError] = useState(false);
const [message, setMessage] = useState("");
const [loading, setLoading] = useState(false);

const onSubmit = async (data) => {
    setShowSuccess(false);
    setShowError(false);
    setMessage("");
    setLoading(true);

    try {
        const response = await fetch(
            "http://127.0.0.1:8000/login",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.detail || "Invalid email or password."
            );
        }

        // Store authentication token
        sessionStorage.setItem("access_token", result.access_token);

        // Show success alert
        setShowSuccess(true);

        // Navigate to dashboard after 2 seconds
        setTimeout(() => {
            navigate("/dashboard");
        }, 2000);

    } catch (error) {
        setMessage(error.message);
        setShowError(true);

    } finally {
        setLoading(false);
    }
};


return (
    <div className="auth-container">
        <div className="auth-card">

            <h2>Welcome Back</h2>
            <h3>Employee Management System</h3>
            <p>Login to continue</p>

            {/* Separate Success Alert */}
            {showSuccess && (
                <div className="success-alert">

                    <div className="success-icon">
                        ✓
                    </div>

                    <div className="success-text">
                        <h3>Login Successful!</h3>
                        <p>You have logged in successfully.</p>
                    </div>

                    <button
                        type="button"
                        className="close-btn"
                        onClick={() => setShowSuccess(false)}
                    >
                        ×
                    </button>

                </div>
            )}

            {/* Separate Error Alert */}
            {showError && (
                <div className="error-alert">

                    <div className="error-icon">
                        !
                    </div>

                    <div className="error-text">
                        <h3>Login Failed!</h3>
                        <p>{message}</p>
                    </div>

                    <button
                        type="button"
                        className="close-btn"
                        onClick={() => setShowError(false)}
                    >
                        ×
                    </button>

                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)}>

                <div className="form-group">
                    <label>Email Address</label>
                    <input
                        type="email"
                        placeholder="Enter your email"
                        {...register("email", {
                            required: "Email is required."
                        })}
                    />
                    <small>{errors.email?.message}</small>
                </div>

                <div className="form-group">
                    <label>Password</label>
                    <input
                        type="password"
                        placeholder="Enter your password"
                        {...register("password", {
                            required: "Password is required."
                        })}
                    />
                    <small>{errors.password?.message}</small>
                </div>

                <div className="button-group">

                    <button
                        type="submit"
                        className="register-btn"
                        disabled={loading}
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>

                    <button
                        type="button"
                        className="reset-btn"
                        onClick={() => reset()}
                    >
                        Reset
                    </button>

                </div>

                <p className="login-link">
                    Don't have an account?
                    <Link to="/register">Register</Link>
                </p>

            </form>

        </div>
    </div>
);
}

export default Login;
