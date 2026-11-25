
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import "../EmployeeManagement.css";
import "../Dashboard.css";

const API_URL = "http://127.0.0.1:8000";

const initialFormData = {
    full_name: "",
    email: "",
    mobile: "",
    department: "",
    designation: "",
    joining_date: "",
    status: "Active"
};

function EditEmployee() {
    const navigate = useNavigate();
    const location = useLocation();

    const token = sessionStorage.getItem("access_token");
    const employee = location.state?.employee;

    const [userName] = useState("Soundarya");

    const [formData, setFormData] = useState(() => {
        if (!employee) return initialFormData;

        return {
            full_name: employee.full_name || "",
            email: employee.email || "",
            mobile: employee.mobile || "",
            department: employee.department || "",
            designation: employee.designation || "",
            joining_date: employee.joining_date
                ? String(employee.joining_date).slice(0, 10)
                : "",
            status: employee.status || "Active"
        };
    });

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // Redirect if the user is not logged in.
    useEffect(() => {
        if (!token) {
            navigate("/login", { replace: true });
        }
    }, [token, navigate]);

    // Load the selected employee's details.
    useEffect(() => {
        if (employee) {
            setFormData({
                full_name: employee.full_name || "",
                email: employee.email || "",
                mobile: employee.mobile || "",
                department: employee.department || "",
                designation: employee.designation || "",
                joining_date: employee.joining_date
                    ? String(employee.joining_date).slice(0, 10)
                    : "",
                status: employee.status || "Active"
            });
        } else {
            setError(
                "Employee details are unavailable. Please select an employee again."
            );
        }
    }, [employee]);

    // Handle input changes.
    const handleInputChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    // Cancel and return to Employee Management.
    const handleCancel = () => {
        navigate("/employee-management");
    };

    // Update employee details.
    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!employee) {
            setError("Employee details are unavailable. Please select an employee again.");
            return;
        }

        setSaving(true);
        setError("");

        try {
            const response = await fetch(
                `${API_URL}/employees/${employee.employee_id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        ...formData,
                        joining_date: formData.joining_date || null
                    })
                }
            );

            if (response.status === 401) {
                sessionStorage.removeItem("access_token");
                navigate("/login", { replace: true });
                return;
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.detail || "Unable to update employee details."
                );
            }

            // Return to Employee Management with success message.
            navigate("/employee-management", {
                state: {
                    success: "Employee details have been updated successfully!"
                }
            });

        } catch (err) {
            setError(err.message || "Something went wrong.");
        } finally {
            setSaving(false);
        }
    };

    if (!token) {
        return null;
    }

    return (
        <div className="dashboard-container">

            {/* Static Sidebar */}
            <Sidebar
                userName={userName}
                activePage="manage"
                onLogout={handleCancel}
            />

            {/* Main Content */}
            <main className="employee-management-main">

                {/* Error Message */}
                {error && (
                    <div className="employee-error-message">
                        <span>{error}</span>

                        <button
                            type="button"
                            onClick={() => setError("")}
                            aria-label="Close error message"
                        >
                            ×
                        </button>
                    </div>
                )}

                {/* Edit Employee Form */}
                <section className="employee-form-card">

                    <div className="employee-form-header">
                        <div>
                            <h2>Edit Employee Details</h2>
                            <p>Update the employee information below.</p>
                        </div>

                        <button
                            type="button"
                            className="employee-form-close"
                            onClick={handleCancel}
                            aria-label="Close form"
                        >
                            ×
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>

                        <div className="employee-form-grid">

                            {/* Full Name */}
                            <div className="employee-form-group">
                                <label htmlFor="full_name">
                                    Full Name
                                </label>

                                <input
                                    id="full_name"
                                    type="text"
                                    name="full_name"
                                    placeholder="Enter full name"
                                    value={formData.full_name}
                                    onChange={handleInputChange}
                                    minLength="3"
                                    maxLength="100"
                                    required
                                />
                            </div>

                            {/* Email */}
                            <div className="employee-form-group">
                                <label htmlFor="email">
                                    Official Email
                                </label>

                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    placeholder="Enter official email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            {/* Mobile */}
                            <div className="employee-form-group">
                                <label htmlFor="mobile">
                                    Contact Number
                                </label>

                                <input
                                    id="mobile"
                                    type="tel"
                                    name="mobile"
                                    placeholder="10-digit mobile number"
                                    value={formData.mobile}
                                    onChange={(event) => {
                                        const mobile = event.target.value
                                            .replace(/[^0-9]/g, "")
                                            .slice(0, 10);

                                        setFormData((previous) => ({
                                            ...previous,
                                            mobile
                                        }));
                                    }}
                                    pattern="[0-9]{10}"
                                    maxLength="10"
                                    required
                                />
                            </div>

                            {/* Department */}
                            <div className="employee-form-group">
                                <label htmlFor="department">
                                    Department
                                </label>

                                <input
                                    id="department"
                                    type="text"
                                    name="department"
                                    placeholder="Enter department"
                                    value={formData.department}
                                    onChange={handleInputChange}
                                    maxLength="100"
                                    required
                                />
                            </div>

                            {/* Designation */}
                            <div className="employee-form-group">
                                <label htmlFor="designation">
                                    Designation
                                </label>

                                <input
                                    id="designation"
                                    type="text"
                                    name="designation"
                                    placeholder="Enter designation"
                                    value={formData.designation}
                                    onChange={handleInputChange}
                                    maxLength="100"
                                    required
                                />
                            </div>

                            {/* Joining Date */}
                            <div className="employee-form-group">
                                <label htmlFor="joining_date">
                                    Joining Date
                                </label>

                                <input
                                    id="joining_date"
                                    type="date"
                                    name="joining_date"
                                    value={formData.joining_date}
                                    onChange={handleInputChange}
                                />
                            </div>

                            {/* Status */}
                            <div className="employee-form-group">
                                <label htmlFor="status">
                                    Employee Status
                                </label>

                                <select
                                    id="status"
                                    name="status"
                                    value={formData.status}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="Active">
                                        Active
                                    </option>

                                    <option value="Inactive">
                                        Inactive
                                    </option>
                                </select>
                            </div>

                        </div>

                        {/* Form Actions */}
                        <div className="employee-form-actions">

                            <button
                                type="button"
                                className="employee-cancel-btn"
                                onClick={handleCancel}
                                disabled={saving}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="employee-save-btn"
                                disabled={saving || !employee}
                            >
                                {saving
                                    ? "Updating..."
                                    : "Update Employee"}
                            </button>

                        </div>

                    </form>
                </section>

            </main>
        </div>
    );
}

export default EditEmployee;
