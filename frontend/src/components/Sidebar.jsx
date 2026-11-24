
import React from "react";
import { Link } from "react-router-dom";
import "../Sidebar.css";

function Sidebar({ userName = "Soundarya", activePage, onLogout }) {

    return (
        <aside className="sidebar">

            {/* Brand */}
            <div className="sidebar-brand">
                <h2>EMS</h2>
                <p>Employee Management</p>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">

                <p className="sidebar-heading">DASHBOARD</p>

                <Link
                    to="/dashboard#employee-overview"
                    className={`sidebar-link ${
                        activePage === "employees" ? "active" : ""
                    }`}
                >
                    <span>♙</span>
                    Employees
                </Link>

                <Link
                    to="/employee-management"
                    className={`sidebar-link ${
                        activePage === "manage" ? "active" : ""
                    }`}
                >
                    <span>＋</span>
                    Manage Employees
                </Link>

            </nav>

            {/* Logout */}
            <button
                type="button"
                className="sidebar-logout"
                onClick={onLogout}
            >
                ↪ Logout
            </button>

        </aside>
    );
}

export default Sidebar;
