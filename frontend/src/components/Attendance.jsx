
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import "../Attendance.css";
import "../Dashboard.css";

const API_URL = "http://127.0.0.1:8000";

// Get today's date in local YYYY-MM-DD format
const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

// Format backend time (09:00:00) as 09:00 AM
const formatTime = (time) => {
    if (!time) return "-";

    const [hours, minutes] = time.split(":");
    const date = new Date();

    date.setHours(Number(hours), Number(minutes), 0);

    return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
    });
};

function Attendance() {
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [selectedDate, setSelectedDate] = useState(getTodayDate());
    const [search, setSearch] = useState("");
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    

    // Fetch logged-in user details
    useEffect(() => {
        const fetchLoggedInUser = async () => {
            const token = sessionStorage.getItem("access_token");

            if (!token) {
                navigate("/login", { replace: true });
                return;
            }

            try {
                const response = await fetch(`${API_URL}/auth/me`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (response.status === 401) {
                    sessionStorage.removeItem("access_token");
                    navigate("/login", { replace: true });
                    return;
                }

                if (!response.ok) {
                    throw new Error("Unable to fetch user details.");
                }

                const result = await response.json();
                setUser(result);

            } catch (error) {
                console.error("User details error:", error);
            }
        };

        fetchLoggedInUser();
    }, [navigate]);

    // Logout and update attendance in the backend

const handleLogout = async () => {

    const token = sessionStorage.getItem("access_token");

    try {

        if (token) {

            const response = await fetch(`${API_URL}/logout`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));

                console.error(
                    "Logout failed:",
                    errorData.detail || response.statusText
                );
            }
        }

    } catch (error) {

        console.error("Logout API error:", error);

    } finally {

        sessionStorage.removeItem("access_token");
        setShowLogoutConfirm(false);
        navigate("/login", { replace: true });

    }
};

    // Fetch attendance records from FastAPI
    const fetchAttendance = useCallback(async () => {
        const token = sessionStorage.getItem("access_token");

        if (!token) {
            navigate("/login", { replace: true });
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await fetch(
                `${API_URL}/attendance?date=${selectedDate}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const result = await response.json();

            if (response.status === 401) {
                sessionStorage.removeItem("access_token");
                navigate("/login", { replace: true });
                return;
            }

            if (!response.ok) {
                throw new Error(
                    result.detail || "Unable to load attendance records."
                );
            }

            setEmployees(result);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [selectedDate, navigate]);

    // Load attendance when page opens or date changes
    useEffect(() => {
        fetchAttendance();
    }, [fetchAttendance]);

    // Attendance Summary
    const presentCount = employees.filter(
        emp => emp.status === "Present"
    ).length;

    const absentCount = employees.filter(
        emp => emp.status === "Absent"
    ).length;

    const lateCount = employees.filter(
        emp => emp.status === "Late"
    ).length;

    const halfDayCount = employees.filter(
        emp => emp.status === "Half Day"
    ).length;

    const holidayCount = employees.filter(
    emp => emp.status === "Holiday"
).length;

const notMarkedCount = employees.filter(
    emp => emp.status === "Not Marked"
).length;

    // Search Employees
    const filteredEmployees = employees.filter(emp =>
        emp.full_name.toLowerCase().includes(search.toLowerCase()) ||
        String(emp.employee_id).includes(search)
    );

    return (
        <div className="attendance-layout">

            {/* Sidebar */}
          <Sidebar
    activePage="attendance"
    onLogout={() => setShowLogoutConfirm(true)}
/>

            {/* Main Content */}
            <main className="attendance-main">

                {/* Main Header */}
                <header className="dashboard-header attendance-main-header">

                    <div className="attendance-title">
                        <h1>Attendance Management</h1>
                        <p>Track and manage employee attendance.</p>
                    </div>

                    <div className="user-profile">

                        <div className="user-avatar">
                            {user?.full_name?.charAt(0).toUpperCase() || "U"}
                        </div>

                        <div className="user-details">
                            <h4>{user?.full_name || "Loading..."}</h4>
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

                {/* Attendance Overview and Date Selector */}
<div className="attendance-date-toolbar">

    <div className="attendance-overview">
        <h2>Attendance Overview</h2>
        <p>Overview of your organization's employee attendance</p>
    </div>

    <div className="attendance-date">
        <label htmlFor="attendanceDate">
            Select Date
        </label>

        <input
            type="date"
            id="attendanceDate"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
        />
    </div>

</div>

                {/* Attendance Summary Cards */}
<div className="stats-grid attendance-stats-grid">

    <div className="stat-card total-card">
        <div className="stat-icon">♙</div>
        <div className="stat-info">
            <p>Total Employees</p>
            <h2>{employees.length}</h2>
        </div>
    </div>

    <div className="stat-card active-card">
        <div className="stat-icon">✓</div>
        <div className="stat-info">
            <p>Present</p>
            <h2>{presentCount}</h2>
        </div>
    </div>

    <div className="stat-card inactive-card">
        <div className="stat-icon">✕</div>
        <div className="stat-info">
            <p>Absent</p>
            <h2>{absentCount}</h2>
        </div>
    </div>

    <div className="stat-card late-card">
        <div className="stat-icon">◷</div>
        <div className="stat-info">
            <p>Late</p>
            <h2>{lateCount}</h2>
        </div>
    </div>

    <div className="stat-card halfday-card">
        <div className="stat-icon">◐</div>
        <div className="stat-info">
            <p>Half Day</p>
            <h2>{halfDayCount}</h2>
        </div>
    </div>

</div>
                {/* Employee Attendance Table */}
                <section className="attendance-table-section">

                    <div className="attendance-table-header">

                        <div>
                            <h2>Employee Attendance</h2>
                            <p>
                                View daily employee attendance records.
                            </p>
                        </div>

                        <input
                            type="text"
                            placeholder="Search employee..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="attendance-search"
                        />

                    </div>

                    {/* Error Message */}
                    {error && (
                        <p className="attendance-error">
                            {error}
                        </p>
                    )}

                    <div className="attendance-table-wrapper">

                        <table className="attendance-table">

                            <thead>
                                <tr>
                                    <th>Employee ID</th>
                                    <th>Employee Name</th>
                                    <th>Department</th>
                                    <th>Check In</th>
                                    <th>Check Out</th>
                                    <th>Status</th>
                                </tr>
                            </thead>

                            <tbody>

                                {loading ? (

                                    <tr>
                                        <td
                                            colSpan="6"
                                            className="no-attendance"
                                        >
                                            Loading attendance records...
                                        </td>
                                    </tr>

                                ) : filteredEmployees.length > 0 ? (

                                    filteredEmployees.map(employee => (

                                        <tr key={employee.employee_id}>

                                            <td>
                                                EMP-{String(employee.employee_id).padStart(3, "0")}
                                            </td>

                                            <td className="attendance-employee-name">
                                                {employee.full_name}
                                            </td>

                                            <td>
                                                {employee.department}
                                            </td>

                                            {/* Automatic Check-in Time */}
                                            <td>
                                                {formatTime(employee.check_in)}
                                            </td>

                                            {/* Automatic Check-out Time */}
                                            <td>
                                                {formatTime(employee.check_out)}
                                            </td>

                                            {/* Attendance Status */}
                                            <td>
                                                <span
                                                    className={`attendance-status ${
                                                        (employee.status || "Not Marked")
                                                            .toLowerCase()
                                                            .replace(" ", "-")
                                                    }`}
                                                >
                                                    {employee.status || "Not Marked"}
                                                </span>
                                            </td>

                                        </tr>

                                    ))

                                ) : (

                                    <tr>
                                        <td
                                            colSpan="6"
                                            className="no-attendance"
                                        >
                                            No employees found.
                                        </td>
                                    </tr>

                                )}

                            </tbody>

                        </table>

                    </div>

                </section>

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

export default Attendance;
