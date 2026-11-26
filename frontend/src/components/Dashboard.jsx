
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "./Sidebar";
import "../Dashboard.css";
const API_URL = "http://127.0.0.1:8000";

import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title
} from "chart.js";

import { Doughnut, Bar } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title
);

function Dashboard() {

    const navigate = useNavigate();

    const [user, setUser] = useState(null);

    const [stats, setStats] = useState({
        total_employees: 0,
        active_employees: 0,
        inactive_employees: 0,
        department_count: 0,
        department_stats: []
    });

    const [recentEmployees, setRecentEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const token = sessionStorage.getItem("access_token");

    // Fetch Dashboard Data
    useEffect(() => {

        const fetchDashboardData = async () => {

            try {

                const headers = {
                    Authorization: `Bearer ${token}`
                };

                const [
                    userResponse,
                    statsResponse,
                    recentResponse
                ] = await Promise.all([

                    fetch("http://127.0.0.1:8000/auth/me", {
                        headers
                    }),

                    fetch("http://127.0.0.1:8000/dashboard/stats", {
                        headers
                    }),

                    fetch("http://127.0.0.1:8000/employees/recent", {
                        headers
                    })

                ]);

                // Check Authentication
                if (
                    userResponse.status === 401 ||
                    statsResponse.status === 401 ||
                    recentResponse.status === 401
                ) {

                    sessionStorage.removeItem("access_token");

                    navigate("/login", {
                        replace: true
                    });

                    return;
                }

                if (
                    !userResponse.ok ||
                    !statsResponse.ok ||
                    !recentResponse.ok
                ) {

                    throw new Error(
                        "Unable to load dashboard information."
                    );

                }

                const userData = await userResponse.json();
                const statsData = await statsResponse.json();
                const recentData = await recentResponse.json();

                setUser(userData);
                setStats(statsData);
                setRecentEmployees(recentData);

            } catch (err) {

                console.error("Dashboard Error:", err);
                setError(err.message);

            } finally {

                setLoading(false);

            }

        };

        if (!token) {

            navigate("/login", {
                replace: true
            });

            return;
        }

        fetchDashboardData();

    }, [token, navigate]);

    // Logout
  const handleLogout = async () => {
    const token = sessionStorage.getItem("access_token");

    if (!token) {
        navigate("/login");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/logout`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            alert(data.detail || "Unable to logout.");
            return;
        }

        console.log(data.message);

        sessionStorage.removeItem("access_token");
        navigate("/login");

    } catch (error) {
        console.error("Logout error:", error);
        alert("Unable to connect to the server.");
    }
};

    // Navigate to Employee Management
    const handleManageEmployees = () => {

        navigate("/employee-management");

    };

    // Doughnut Chart Data
    const statusChartData = {

        labels: [
            "Active Employees",
            "Inactive Employees"
        ],

        datasets: [
            {
                data: [
                    stats.active_employees,
                    stats.inactive_employees
                ],

                backgroundColor: [
                    "#16a34a",
                    "#dc2626"
                ],

                borderColor: [
                    "#ffffff",
                    "#ffffff"
                ],

                borderWidth: 3,
                hoverOffset: 8
            }
        ]

    };

    // Doughnut Chart Options
    const statusChartOptions = {

        responsive: true,
        maintainAspectRatio: false,
        cutout: "70%",

        plugins: {

            legend: {
                position: "bottom",

                labels: {
                    padding: 20,
                    usePointStyle: true
                }
            }

        }

    };

    // Department Bar Chart Data
    const departmentChartData = {

        labels: (stats.department_stats || []).map(
            item => item.department
        ),

        datasets: [
            {
                label: "Employees",

                data: (stats.department_stats || []).map(
                    item => item.count
                ),

                backgroundColor: "#3b82f6",
                borderRadius: 6,
                barThickness: 22
            }
        ]

    };

    // Department Bar Chart Options
    const departmentChartOptions = {

        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,

        plugins: {

            legend: {
                display: false
            },

            tooltip: {
                enabled: true
            }

        },

        scales: {

            x: {
                beginAtZero: true,

                ticks: {
                    precision: 0,
                    stepSize: 1
                }
            },

            y: {
                grid: {
                    display: false
                }
            }

        }

    };

    // Loading
    if (loading) {

        return (
            <div className="dashboard-loading">
                Loading Dashboard...
            </div>
        );

    }

    // Error
    if (error) {

        return (
            <div className="dashboard-error">
                {error}
            </div>
        );

    }

    return (

        <div className="dashboard-container">

            {/* Shared Sidebar */}
            <Sidebar
                userName={user?.full_name || "Soundarya"}
                activePage="employees"
                onLogout={handleLogout}
            />

            {/* Main Content */}
            <main className="dashboard-main">

                {/* Header */}
                <header className="dashboard-header">

                    <div>
                        <h1>Employee Dashboard</h1>
                        <p>Manage and monitor your employees</p>
                    </div>

                    <div className="user-profile">

                        <div className="user-avatar">
                            {user?.full_name?.charAt(0).toUpperCase()}
                        </div>

                        <div className="user-details">
                            <h4>{user?.full_name}</h4>
                        </div>
<button
    className="header-logout"
    onClick={() => setShowLogoutConfirm(true)}
>
    Logout
</button>

                    </div>

                </header>

                {/* Employee Overview */}
                <section
                    className="employee-overview"
                    id="employee-overview"
                >

                    <div className="section-heading">

                        <div>
                            <h2>Employee Overview</h2>
                            <p>
                                Overview of your organization's employees
                            </p>
                        </div>

                    </div>

                    {/* Summary Cards */}
                    <div className="stats-grid">

                        <div className="stat-card total-card">

                            <div className="stat-icon">♙</div>

                            <div className="stat-info">
                                <p>Total Employees</p>
                                <h2>{stats.total_employees}</h2>
                                <span>Overall employees</span>
                            </div>

                        </div>

                        <div className="stat-card active-card">

                            <div className="stat-icon">✓</div>

                            <div className="stat-info">
                                <p>Active Employees</p>
                                <h2>{stats.active_employees}</h2>
                                <span>Currently active</span>
                            </div>

                        </div>

                        <div className="stat-card inactive-card">

                            <div className="stat-icon">−</div>

                            <div className="stat-info">
                                <p>Inactive Employees</p>
                                <h2>{stats.inactive_employees}</h2>
                                <span>Currently inactive</span>
                            </div>

                        </div>

                        <div className="stat-card department-card">

                            <div className="stat-icon">▤</div>

                            <div className="stat-info">
                                <p>Departments</p>
                                <h2>{stats.department_count}</h2>
                                <span>Total departments</span>
                            </div>

                        </div>

                    </div>

                    {/* Employee Statistical Charts */}
                    <div className="statistics-section">

                        <div className="section-title">
                            <h2>Employee Statistical Charts</h2>

                            <p>
                                Employee status and department-wise distribution
                            </p>
                        </div>

                        <div className="statistics-grid">

                            {/* Doughnut Chart */}
                            <div className="dashboard-panel">

                                <h3>Employee Status Overview</h3>

                                <p className="chart-subtitle">
                                    Active and inactive employee distribution
                                </p>

                                <div className="chart-display doughnut-display">

                                    <Doughnut
                                        data={statusChartData}
                                        options={statusChartOptions}
                                    />

                                </div>

                            </div>

                            {/* Department Bar Chart */}
                            <div className="dashboard-panel">

                                <h3>Department Statistics</h3>

                                <p className="chart-subtitle">
                                    Department-wise employee distribution
                                </p>

                                {stats.department_stats &&
                                stats.department_stats.length > 0 ? (

                                    <div className="chart-display bar-display">

                                        <Bar
                                            data={departmentChartData}
                                            options={departmentChartOptions}
                                        />

                                    </div>

                                ) : (

                                    <p className="empty-message">
                                        No department data available.
                                    </p>

                                )}

                            </div>

                        </div>

                    </div>

                </section>

                {/* Recently Added Employees */}
                <section className="recent-section">

                    <div className="section-title">
                        <h2>Recently Added Employees</h2>

                        <p>
                            Latest five employees registered in the system
                        </p>
                    </div>

                    <div className="dashboard-panel">

                        <div className="table-wrapper">

                            <table className="employee-table">

                                <thead>
                                    <tr>
                                        <th>Employee ID</th>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Department</th>
                                        <th>Designation</th>
                                        <th>Joining Date</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {recentEmployees.length === 0 ? (

                                        <tr>
                                            <td
                                                colSpan="7"
                                                className="empty-message"
                                            >
                                                No employees found.
                                            </td>
                                        </tr>

                                    ) : (

                                        recentEmployees.map((employee) => (

                                            <tr key={employee.employee_id}>

                                                <td>
                                                    EMP-{employee.employee_id}
                                                </td>

                                                <td>{employee.full_name}</td>

                                                <td>{employee.email}</td>

                                                <td>{employee.department}</td>

                                                <td>{employee.designation}</td>

                                                <td>
                                                    {employee.joining_date
                                                        ? new Date(
                                                            employee.joining_date + "T00:00:00"
                                                        ).toLocaleDateString("en-IN")
                                                        : "Not Available"}
                                                </td>

                                                <td>

                                                    <span
                                                        className={
                                                            employee.status?.toLowerCase() === "active"
                                                                ? "status-badge active-badge"
                                                                : "status-badge inactive-badge"
                                                        }
                                                    >
                                                        {employee.status}
                                                    </span>

                                                </td>

                                            </tr>

                                        ))

                                    )}

                                </tbody>

                            </table>

                        </div>

                    </div>

                </section>

            </main>
            {showLogoutConfirm && (
    <div className="logout-overlay">
        <div className="logout-dialog">
            <h2>Confirm Logout</h2>

            <p>Are you sure you want to log out of your account?</p>

            <div className="logout-actions">
                <button
                    className="cancel-btn"
                    onClick={() => setShowLogoutConfirm(false)}
                >
                    Cancel
                </button>

                <button
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

export default Dashboard;
