
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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

function EmployeeManagement() {

    const navigate = useNavigate();

    const token = sessionStorage.getItem("access_token");

    const [userName, setUserName] = useState("Soundarya");
    const [employees, setEmployees] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const [search, setSearch] = useState("");
    const [department, setDepartment] = useState("");
    const [status, setStatus] = useState("All");

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalEmployees, setTotalEmployees] = useState(0);

    // Employee Form
    const [showForm, setShowForm] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [formData, setFormData] = useState(initialFormData);

    // Loading and Messages
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [showDeactivateModal, setShowDeactivateModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [isDeactivating, setIsDeactivating] = useState(false);

    // Permanent Delete Dialog
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [employeeToDelete, setEmployeeToDelete] = useState(null);

    const location = useLocation();

    // Redirect to login if user is not authenticated.
    useEffect(() => {

        if (!token) {
            navigate("/login", { replace: true });
        }

    }, [token, navigate]);


    // Fetch logged-in user details.
    useEffect(() => {

        if (!token) return;

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
                console.error("Unable to fetch user details:", err);
            }

        };

        fetchUser();

    }, [token, navigate]);

    useEffect(() => {

    if (location.state?.success) {
        setSuccess(location.state.success);

        navigate(location.pathname, {
            replace: true,
            state: null
        });
    }

}, [location, navigate]);


    // Fetch employees whenever search, filters or page changes.
    useEffect(() => {

        if (!token) return;

        const fetchEmployees = async () => {

            setLoading(true);
            setError("");

            try {

                const params = new URLSearchParams({
                    search,
                    department,
                    status,
                    page: String(page),
                    page_size: "5"
                });

                const response = await fetch(
                    `${API_URL}/employees?${params.toString()}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
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
                        data.detail || "Unable to load employees."
                    );
                }

                setEmployees(data.items || []);
                setDepartments(data.departments || []);
                setTotalEmployees(data.total || 0);
                setTotalPages(Math.max(data.total_pages || 1, 1));

            } catch (err) {

                setError(err.message || "Something went wrong.");

            } finally {

                setLoading(false);

            }

        };

        fetchEmployees();

    }, [token, search, department, status, page, navigate]);


   const handleAddEmployee = () => {
    navigate("/add-employee");
};

    // Open the form with existing employee details.
const handleEditEmployee = (employee) => {
    navigate("/edit-employee", {
        state: {
            employee: employee
        }
    });
};

    // Update form field values.
    const handleInputChange = (event) => {

        const { name, value } = event.target;

        setFormData((previousData) => ({
            ...previousData,
            [name]: value
        }));

    };


    // Close and reset the employee form.
    const handleCloseForm = () => {

        setShowForm(false);
        setEditingEmployee(null);
        setFormData(initialFormData);
        setError("");

    };

// Add a new employee or update an existing employee.
const handleSubmit = async (event) => {

    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {

        const employeeData = {
            ...formData,
            joining_date: formData.joining_date || null
        };

        const isEditing = Boolean(editingEmployee);

        const url = isEditing
            ? `${API_URL}/employees/${editingEmployee.employee_id}`
            : `${API_URL}/employees`;

        const response = await fetch(url, {

            method: isEditing ? "PUT" : "POST",

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
                data.detail || "Unable to save employee details."
            );
        }

        // Close the form and reset the fields.
        setShowForm(false);
        setEditingEmployee(null);
        setFormData(initialFormData);

        // Display success notification.
        setSuccess(
            isEditing
                ? "Employee details have been updated successfully!"
                : "New employee has been added successfully!"
        );

        // Return to the first page.
        setPage(1);

        // Refresh employee records.
        const params = new URLSearchParams({
            search,
            department,
            status,
            page: "1",
            page_size: "5"
        });

        const refreshResponse = await fetch(
            `${API_URL}/employees?${params.toString()}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (refreshResponse.ok) {

            const refreshedData = await refreshResponse.json();

            setEmployees(refreshedData.items || []);
            setDepartments(refreshedData.departments || []);
            setTotalEmployees(refreshedData.total || 0);
            setTotalPages(
                Math.max(refreshedData.total_pages || 1, 1)
            );

        }

    } catch (err) {

        setError(err.message || "Something went wrong.");

    } finally {

        setSaving(false);

    }

};

    // Deactivate employee instead of permanently deleting.

   // Open custom deactivate confirmation dialog.
   
const handleDeleteEmployee = (employee) => {
    setSelectedEmployee(employee);
    setShowDeactivateModal(true);
};

// Confirm employee deactivation.
const confirmDeactivateEmployee = async () => {

    if (!selectedEmployee) return;

    setError("");
    setSuccess("");
    setIsDeactivating(true);

    try {

        const response = await fetch(
            `${API_URL}/employees/${selectedEmployee.employee_id}`,
            {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`
                }
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
                data.detail || "Unable to deactivate employee."
            );
        }

        setShowDeactivateModal(false);
        setSelectedEmployee(null);

        setSuccess(
            "Employee moved to inactive employees successfully!"
        );

        // Refresh the current employee list.
        const params = new URLSearchParams({
            search,
            department,
            status,
            page: String(page),
            page_size: "5"
        });

        const refreshResponse = await fetch(
            `${API_URL}/employees?${params.toString()}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (refreshResponse.ok) {

            const refreshedData = await refreshResponse.json();

            setEmployees(refreshedData.items || []);
            setDepartments(refreshedData.departments || []);
            setTotalEmployees(refreshedData.total || 0);
            setTotalPages(
                Math.max(refreshedData.total_pages || 1, 1)
            );

            // Move to previous page if current page becomes empty.
            if (
                (refreshedData.items || []).length === 0 &&
                page > 1
            ) {
                setPage((previousPage) => previousPage - 1);
            }
        }

    } catch (err) {

        setError(err.message || "Something went wrong.");

    } finally {

        setIsDeactivating(false);

    }
};


    // Open permanent delete confirmation dialog.
    const handlePermanentDelete = (employee) => {

        setEmployeeToDelete(employee);
        setShowDeleteDialog(true);

    };


    // Confirm and permanently delete employee.
   
const confirmPermanentDelete = async () => {
    if (!employeeToDelete) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
        const response = await fetch(
            `${API_URL}/employees/${employeeToDelete.employee_id}/permanent`,
            {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(
                data.detail || `Delete failed. Status: ${response.status}`
            );
        }

        const deletedEmployeeId = employeeToDelete.employee_id;

        setEmployees((previousEmployees) =>
            previousEmployees.filter(
                (employee) => employee.employee_id !== deletedEmployeeId
            )
        );

        setTotalEmployees((previousTotal) =>
            Math.max(previousTotal - 1, 0)
        );

        setSuccess("Employee permanently deleted successfully!");

        setShowDeleteDialog(false);
        setEmployeeToDelete(null);

        if (employees.length === 1 && page > 1) {
            setPage((previousPage) => previousPage - 1);
        }

    } catch (err) {
        console.error("Permanent delete error:", err);
        setError(err.message || "Unable to delete employee.");
    } finally {
        setSaving(false);
    }
};

    // Cancel permanent deletion.
    const cancelPermanentDelete = () => {

        if (saving) return;

        setShowDeleteDialog(false);
        setEmployeeToDelete(null);

    };


// Confirm and process logout.
const handleLogout = async () => {

    try {

        await fetch(`${API_URL}/logout`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

    } catch (error) {

        console.error("Logout request failed:", error);

    } finally {

        sessionStorage.removeItem("access_token");
        setShowLogoutConfirm(false);
        navigate("/login", { replace: true });

    }

};


    return (

        <div className="dashboard-container">

            {/* Sidebar */}
         <Sidebar
    userName={userName}
    activePage="manage"
    onLogout={() => setShowLogoutConfirm(true)}
/>

            {/* Main Content */}
            <main className="employee-management-main">


                {/* Header */}
                <header className="dashboard-header">

                    <div>
                        <h1>Employee Management</h1>
                        <p>
                            Manage, update, and monitor employee records
                        </p>
                    </div>

                    <div className="user-profile">

                        <div className="user-avatar">
                            {userName?.charAt(0).toUpperCase()}
                        </div>

                        <div className="user-details">
                            <h4>{userName}</h4>
                        </div>

<button
    type="button"
    className="header-logout"
    onClick={() => setShowLogoutConfirm(true)}
>
    Logout
</button>

                    </div>

                </header>


                
{/* Success Message */}
{success && (
    <div className="employee-success-alert">

        <div className="employee-success-icon">
            ✓
        </div>

        <div className="employee-success-text">
            <h3>Success!</h3>
            <p>{success}</p>
        </div>

        <button
            type="button"
            className="employee-success-close"
            onClick={() => setSuccess("")}
            aria-label="Close success message"
        >
            ×
        </button>

    </div>
)}


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

                {/* Deactivate Employee Confirmation Modal */}

{showDeactivateModal && selectedEmployee && (

    <div className="deactivate-modal-overlay">

        <div className="deactivate-modal">

            <div className="deactivate-modal-icon">
                !
            </div>

            <h2>Deactivate Employee?</h2>

            <p>
                Are you sure you want to deactivate
                <strong> {selectedEmployee.full_name}</strong>?
            </p>

            <p className="deactivate-modal-description">
                This employee will be moved to inactive employees.
                You can reactivate the employee later if needed.
            </p>

            <div className="deactivate-modal-actions">

                <button
                    type="button"
                    className="cancel-deactivate-btn"
                    onClick={() => {
                        setShowDeactivateModal(false);
                        setSelectedEmployee(null);
                    }}
                    disabled={isDeactivating}
                >
                    Cancel
                </button>

                <button
                    type="button"
                    className="confirm-deactivate-btn"
                    onClick={confirmDeactivateEmployee}
                    disabled={isDeactivating}
                >
                    {isDeactivating
                        ? "Deactivating..."
                        : "Deactivate"}
                </button>

            </div>

        </div>

    </div>

)}


                {/* Add / Edit Employee Form */}
                {showForm && (

                    <section className="employee-form-card">

                        <div className="employee-form-header">

                            <div>

                                <h2>
                                    {editingEmployee
                                        ? "Edit Employee"
                                        : "Add New Employee"}
                                </h2>

                                <p>
                                    Enter the employee information below.
                                </p>

                            </div>

                            <button
                                type="button"
                                className="employee-form-close"
                                onClick={handleCloseForm}
                                aria-label="Close form"
                            >
                                ×
                            </button>

                        </div>


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
        onChange={(e) => {
            const numericValue = e.target.value
                .replace(/[^0-9]/g, "")
                .slice(0, 10);

            setFormData((prev) => ({
                ...prev,
                mobile: numericValue
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


                            <div className="employee-form-actions">

                                <button
                                    type="button"
                                    className="employee-cancel-btn"
                                    onClick={handleCloseForm}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="employee-save-btn"
                                    disabled={saving}
                                >
                                    {saving
                                        ? "Saving..."
                                        : editingEmployee
                                            ? "Update Employee"
                                            : "Save Employee"}
                                </button>

                            </div>

                        </form>

                    </section>

                )}


                {/* Employee List */}
                <section className="employee-list-card">


                    {/* Employee List Heading */}
                    <div className="employee-list-heading">

                        <div>

                            <h2>Employee Records</h2>

                            <p>
                                View and manage all registered employees
                            </p>

                        </div>


                        <div className="employee-list-actions">

                            <span className="employee-count">
                                Total: {totalEmployees}
                            </span>

                            <button
                                type="button"
                                className="add-employee-btn"
                                onClick={handleAddEmployee}
                            >
                                + Add Employee
                            </button>

                        </div>

                    </div>


                    {/* Search and Filters */}
                    <div className="employee-filters">


                        <div className="employee-search">

                            <span>⌕</span>

                            <input
                                type="search"
                                placeholder="Search by name or email..."
                                value={search}
                                onChange={(event) => {
                                    setSearch(event.target.value);
                                    setPage(1);
                                }}
                            />

                        </div>


                        <select
                            value={department}
                            onChange={(event) => {
                                setDepartment(event.target.value);
                                setPage(1);
                            }}
                            aria-label="Filter by department"
                        >

                            <option value="">
                                All Departments
                            </option>

                            {departments.map((item) => (

                                <option key={item} value={item}>
                                    {item}
                                </option>

                            ))}

                        </select>


                        <select
                            value={status}
                            onChange={(event) => {
                                setStatus(event.target.value);
                                setPage(1);
                            }}
                            aria-label="Filter by status"
                        >

                            <option value="All">
                                All Status
                            </option>

                            <option value="Active">
                                Active
                            </option>

                            <option value="Inactive">
                                Inactive
                            </option>

                        </select>

                    </div>


                    {/* Employee Table */}
                    <div className="employee-table-wrapper">

                        <table className="employee-management-table">


                            <thead>

                                <tr>
                                    <th>Employee ID</th>
                                    <th>Employee Name</th>
                                    <th>Email</th>
                                    <th>Mobile</th>
                                    <th>Department</th>
                                    <th>Designation</th>
                                    <th>Joining Date</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>

                            </thead>


                            <tbody>

                                {loading ? (

                                    <tr>

                                        <td
                                            colSpan="9"
                                            className="employee-empty"
                                        >
                                            Loading employees...
                                        </td>

                                    </tr>

                                ) : employees.length === 0 ? (

                                    <tr>

                                        <td
                                            colSpan="9"
                                            className="employee-empty"
                                        >
                                            No employees found.
                                        </td>

                                    </tr>

                                ) : (

                                    employees.map((employee) => (

                                        <tr key={employee.employee_id}>


                                            <td>
                                                EMP-{String(
                                                    employee.employee_id
                                                ).padStart(4, "0")}
                                            </td>


                                            <td>
                                                {employee.full_name}
                                            </td>


                                            <td>
                                                {employee.email}
                                            </td>


                                            <td>
                                                {employee.mobile}
                                            </td>


                                            <td>
                                                {employee.department}
                                            </td>


                                            <td>
                                                {employee.designation}
                                            </td>


                                            <td>
                                                {employee.joining_date || "—"}
                                            </td>


                                            <td>

                                                <span
                                                    className={`employee-status ${
                                                        employee.status === "Active"
                                                            ? "active"
                                                            : "inactive"
                                                    }`}
                                                >
                                                    {employee.status}
                                                </span>

                                            </td>


                                            <td>

                                                <div className="employee-action-buttons">


                                                    {/* Edit Button */}
                                                    <button
                                                        type="button"
                                                        className="employee-edit-btn"
                                                        onClick={() =>
                                                            handleEditEmployee(employee)
                                                        }
                                                    >
                                                        Edit
                                                    </button>


                                                    {/* Deactivate Button */}
                                                    {employee.status === "Active" && (

                                                        <button
                                                            type="button"
                                                            className="employee-delete-btn"
                                                            onClick={() =>
                                                                handleDeleteEmployee(employee)
                                                            }
                                                        >
                                                            Deactivate
                                                        </button>

                                                    )}


                                                    {/* Permanent Delete Button */}
                                                    <button
                                                        type="button"
                                                        className="employee-permanent-delete-btn"
                                                        onClick={() =>
                                                            handlePermanentDelete(employee)
                                                        }
                                                    >
                                                        Delete
                                                    </button>


                                                </div>

                                            </td>

                                        </tr>

                                    ))

                                )}

                            </tbody>

                        </table>

                    </div>


                    {/* Pagination */}
                    <div className="employee-pagination">


                        <p>
                            Showing {employees.length} of {totalEmployees} employees
                        </p>


                        <div className="pagination-buttons">

                            <button
                                type="button"
                                onClick={() =>
                                    setPage((previous) => previous - 1)
                                }
                                disabled={page <= 1 || loading}
                            >
                                Previous
                            </button>


                            <span>
                                Page {page} of {totalPages}
                            </span>


                            <button
                                type="button"
                                onClick={() =>
                                    setPage((previous) => previous + 1)
                                }
                                disabled={page >= totalPages || loading}
                            >
                                Next
                            </button>

                        </div>

                    </div>


                </section>


                {/* Permanent Delete Confirmation Dialog */}
                {showDeleteDialog && employeeToDelete && (

                    <div className="delete-dialog-overlay">

                        <div
                            className="delete-confirmation-dialog"
                            role="alertdialog"
                            aria-modal="true"
                            aria-labelledby="delete-dialog-title"
                        >


                            {/* Warning Icon */}
                            <div className="delete-dialog-icon">
                                !
                            </div>


                            {/* Dialog Heading */}
                            <h2 id="delete-dialog-title">
                                Delete Employee?
                            </h2>


                            {/* Confirmation Message */}
                            <p>
                                Are you sure you want to permanently delete

                                <strong>
                                    {" "}{employeeToDelete.full_name}{" "}
                                </strong>

                                from the employee records?
                            </p>


                            {/* Warning Message */}
                            <span className="delete-warning-text">
                                This action cannot be undone. All employee
                                details will be permanently removed.
                            </span>


                            {/* Dialog Buttons */}
                            <div className="delete-dialog-actions">


                                <button
                                    type="button"
                                    className="delete-cancel-btn"
                                    onClick={cancelPermanentDelete}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>


                                <button
                                    type="button"
                                    className="delete-confirm-btn"
                                    onClick={confirmPermanentDelete}
                                    disabled={saving}
                                >
                                    {saving
                                        ? "Deleting..."
                                        : "Delete Permanently"}
                                </button>


                            </div>


                        </div>

                    </div>

                )}

            </main>

            {/* Logout Confirmation Dialog */}
            {showLogoutConfirm && (

                <div className="logout-overlay">

                    <div
                        className="logout-dialog"
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="logout-dialog-title"
                    >

                        <h2 id="logout-dialog-title">
                            Confirm Logout
                        </h2>

                        <p>
                            Are you sure you want to log out of your account?
                        </p>

                        <div className="logout-actions">

                            <button
                                type="button"
                                className="cancel-btn"
                                onClick={() => setShowLogoutConfirm(false)}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="confirm-btn"
                                onClick={handleLogout}
                            >
                                Yes, Logout
                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>

    );

}

export default EmployeeManagement;
