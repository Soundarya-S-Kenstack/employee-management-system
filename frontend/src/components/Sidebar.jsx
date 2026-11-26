
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../Sidebar.css";

const API_URL = "http://127.0.0.1:8000";

function Sidebar({ userName = "Soundarya", activePage }) {

    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    const navigate = useNavigate();

    const handleLogout = async () => {

        if (loggingOut) return;

        const token = sessionStorage.getItem("access_token");

        if (!token) {
            navigate("/login");
            return;
        }

        setLoggingOut(true);

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
            setShowLogoutConfirm(false);
            navigate("/login");

        } catch (error) {
            console.error("Sidebar logout error:", error);
            alert("Unable to connect to the server.");

        } finally {
            setLoggingOut(false);
        }
    };

    return (
        <aside className="sidebar">

            <div className="sidebar-brand">
                <h2>EMS</h2>
                <p>Employee Management</p>
            </div>

            <nav className="sidebar-nav">

                <p className="sidebar-heading">MAIN MENU</p>

                <Link
                    to="/dashboard#employee-overview"
                    className={`sidebar-link ${activePage === "employees" ? "active" : ""}`}
                >
                    <span>♙</span> Dashboard
                </Link>

                <Link
                    to="/employee-management"
                    className={`sidebar-link ${activePage === "manage" ? "active" : ""}`}
                >
                    <span>＋</span> Employees
                </Link>

                <Link
                    to="/attendance"
                    className={`sidebar-link ${activePage === "attendance" ? "active" : ""}`}
                >
                    <span>▣</span> Attendance
                </Link>

                <Link
                    to="/reports"
                    className={`sidebar-link ${activePage === "reports" ? "active" : ""}`}
                >
                    <span>▤</span> Reports
                </Link>

            </nav>

            <button
                type="button"
                className="sidebar-logout"
                onClick={() => setShowLogoutConfirm(true)}
            >
                ↪ Logout
            </button>

            {showLogoutConfirm && (
                <div className="logout-modal-overlay">
                    <div className="logout-modal">

                        <h3>Confirm Logout</h3>

                        <p>Are you sure you want to logout?</p>

                        <div className="logout-modal-actions">

                            <button
                                type="button"
                                className="logout-cancel-btn"
                                onClick={() => setShowLogoutConfirm(false)}
                                disabled={loggingOut}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="logout-confirm-btn"
                                onClick={handleLogout}
                                disabled={loggingOut}
                            >
                                {loggingOut ? "Logging out..." : "Yes, Logout"}
                            </button>

                        </div>
                    </div>
                </div>
            )}

        </aside>
    );
}

export default Sidebar;
