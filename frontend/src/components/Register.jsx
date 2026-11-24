
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import "../App.css";

function Register() {
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors }
    } = useForm();

    const [message, setMessage] = useState("");
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const password = watch("password");


const onSubmit = async (data) => {
    setMessage("");
    setSuccess(false);
    setLoading(true);

    try {
        const response = await fetch(
            "http://127.0.0.1:8000/register",
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
            throw new Error(result.detail || "Registration failed.");
        }

        // Show success alert
        setSuccess(true);
        setMessage("Registration Successful!");

        // Clear form fields
        reset();

        // Navigate to login after 3 seconds
        setTimeout(() => {
            navigate("/login", {
                state: { registered: true }
            });
        }, 3000);

    } catch (error) {
        setSuccess(false);
        setMessage(error.message);
    } finally {
        setLoading(false);
    }
};

    
return (
    <div className="auth-container">
        <div className="auth-card">
            <h2>Create Account</h2>
            <h3>Employee Management System</h3>
            <p>Register to get started</p>

            {/* Conditional Success / Error Message */}
            {message && (
                <div className={success ? "success-alert" : "error-alert"}>
                    {success && (
                        <div className="success-icon">
                            ✓
                        </div>
                    )}

                    <div className="success-text">
                        <h3>{message}</h3>

                        {success && (
                            <p>Your account has been created successfully.</p>
                        )}
                    </div>

                    <button
                        type="button"
                        className="close-btn"
                        onClick={() => {
                            setSuccess(false);
                            setMessage("");
                        }}
                    >
                        ×
                    </button>
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)}>

                <div className="form-group">
                    <label>Full Name</label>
                    <input
                        type="text"
                        placeholder="Enter your full name"
                        {...register("full_name", {
                            required: "Full name is required.",
                            minLength: {
                                value: 3,
                                message: "Name must contain at least 3 characters."
                            },
                            pattern: {
                                value: /^[A-Za-z ]+$/,
                                message: "Enter a valid name."
                            }
                        })}
                    />
                    <small>{errors.full_name?.message}</small>
                </div>

                <div className="form-group">
                    <label>Email Address</label>
                    <input
                        type="email"
                        placeholder="Enter your email"
                        {...register("email", {
                            required: "Email is required.",
                            pattern: {
                                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                message: "Enter a valid email."
                            }
                        })}
                    />
                    <small>{errors.email?.message}</small>
                </div>
                
<div className="form-group">
    <label>Mobile Number</label>

    <input
        type="tel"
        maxLength="10"
        placeholder="Enter 10-digit mobile number"
        {...register("mobile", {
            required: "Mobile number is required.",
            pattern: {
                value: /^[0-9]{10}$/,
                message: "Mobile number must contain exactly 10 digits."
            },
            onChange: (e) => {
                e.target.value = e.target.value
                    .replace(/[^0-9]/g, "")
                    .slice(0, 10);
            }
        })}
    />

    <small>{errors.mobile?.message}</small>
</div>

                <div className="form-group">
                    <label>Password</label>
                    <input
                        type="password"
                        placeholder="Enter password"
                        {...register("password", {
                            required: "Password is required.",
                            minLength: {
                                value: 8,
                                message: "Password must contain at least 8 characters."
                            },
                            pattern: {
                                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/,
                                message: "Include uppercase, lowercase, number and special character."
                            }
                        })}
                    />
                    <small>{errors.password?.message}</small>
                </div>

                <div className="form-group">
                    <label>Confirm Password</label>
                    <input
                        type="password"
                        placeholder="Confirm password"
                        {...register("confirm_password", {
                            required: "Please confirm your password.",
                            validate: value =>
                                value === password || "Passwords do not match."
                        })}
                    />
                    <small>{errors.confirm_password?.message}</small>
                </div>

                <div className="button-group">
                    <button
                        type="submit"
                        className="register-btn"
                        disabled={loading}
                    >
                        {loading ? "Registering..." : "Register"}
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
                    Already registered?
                    <Link to="/login">Login</Link>
                </p>

            </form>
        </div>
    </div>
);
}

export default Register;
