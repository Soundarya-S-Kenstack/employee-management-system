
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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

function AddEmployee() {

    const navigate = useNavigate();
    const token = sessionStorage.getItem("access_token");

    const [userName, setUserName] = useState("Soundarya");
    const [formData, setFormData] = useState(initialFormData);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {

        if (!token) {
            navigate("/login", { replace: true });
            return;
        }

        const fetchUser = async () => {
            try {
                const response = await fetch(`${API_URL}/auth/me`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (response.status === 401) {
                    sessionStorage.removeItem("access_token");
                    navigate("/login", { replace: true });
                    return;
                }

                if (response.ok) {
                    const data = await response.json();
                    setUserName(data.full_name || "Soundarya");
                }

            } catch (err) {
                console.error("Unable to fetch user:", err);
            }
        };

        fetchUser();

    }, [token, navigate]);


    const handleInputChange = (event) => {

        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));

    };


    const handleSubmit = async (event) => {

        event.preventDefault();

        setSaving(true);
        setError("");

        try {

            const employeeData = {
                ...formData,
                joining_date: formData.joining_date || null
            };

            const response = await fetch(`${API_URL}/employees`, {

                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },

                body: JSON.stringify(employeeData)

            });

            if (response.status === 401) {
                sessionStorage.removeItem("access_token");
                navigate("/login", { replace: true });
                return;
            }

            const data = await response.json();
if (!response.ok) {
    throw new Error(
        data.detail || "Unable to add employee."
    );
}

// Navigate after successful registration
navigate("/employee-management", {
    state: {
        success: "New employee has been added successfully!"
    }
});

        } catch (err) {

            setError(err.message || "Something went wrong.");

        } finally {

            setSaving(false);

        }

    };


    const handleLogout = async () => {

        try {
            await fetch(`${API_URL}/logout`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
        } catch (err) {
            console.error("Logout failed:", err);
        } finally {
            sessionStorage.removeItem("access_token");
            navigate("/login", { replace: true });
        }

    };


    return (

        <div className="dashboard-container">

            {/* Static Sidebar */}
            <Sidebar
                userName={userName}
                activePage="manage"
                onLogout={handleLogout}
            />

            {/* Main Content */}
            <main className="employee-management-main">


                {/* Add Employee Form */}
                <section className="employee-form-card">

                    <div className="employee-form-header">

                        <div>
                            <h2>Employee Information</h2>
                            <p>
                                Enter the employee details below.
                            </p>
                        </div>

                    </div>


                    {error && (
                        <div className="employee-error-message">
                            <span>{error}</span>

                            <button
                                type="button"
                                onClick={() => setError("")}
                            >
                                ×
                            </button>
                        </div>
                    )}


                    <form onSubmit={handleSubmit}>

                        <div className="employee-form-grid">

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
                                        const value = event.target.value
                                            .replace(/[^0-9]/g, "")
                                            .slice(0, 10);

                                        setFormData((previous) => ({
                                            ...previous,
                                            mobile: value
                                        }));
                                    }}
                                    pattern="[0-9]{10}"
                                    maxLength="10"
                                    required
                                />
                            </div>


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
                                onClick={() =>
                                    navigate("/employee-management")
                                }
                                disabled={saving}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="employee-save-btn"
                                disabled={saving}
                            >
                                {saving ? "Saving..." : "Save Employee"}
                            </button>

                        </div>

                    </form>

                </section>

            </main>

        </div>

    );

}

export default AddEmployee;
