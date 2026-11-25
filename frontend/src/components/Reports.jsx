
import React, { useState } from "react";
import Sidebar from "./Sidebar";
import "../Reports.css";

const API_URL = "http://127.0.0.1:8000";

const reportOptions = [
    { value: "employee_overview", label: "Employee Overview" },
    { value: "department_wise", label: "Department-wise Report" },
    { value: "daily_attendance", label: "Daily Attendance" },
    { value: "monthly_attendance", label: "Monthly Attendance" },
    { value: "joining", label: "Joining Report" },
    { value: "employee_status", label: "Employee Status" },
    { value: "late_arrival", label: "Late Arrival Report" },
    { value: "absence", label: "Absence Report" },
    { value: "working_hours", label: "Working Hours Report" }
];

function Reports() {
    const [reportType, setReportType] = useState("employee_overview");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [department, setDepartment] = useState("");
    const [employeeStatus, setEmployeeStatus] = useState("");
    const [attendanceStatus, setAttendanceStatus] = useState("");

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const token = sessionStorage.getItem("access_token");

    const buildQuery = () => {
        const params = new URLSearchParams({
            report_type: reportType
        });

        if (fromDate) params.append("from_date", fromDate);
        if (toDate) params.append("to_date", toDate);
        if (department) params.append("department", department);
        if (employeeStatus) params.append("employee_status", employeeStatus);
        if (attendanceStatus) params.append("attendance_status", attendanceStatus);

        return params.toString();
    };

    const generateReport = async () => {
        if (fromDate && toDate && fromDate > toDate) {
            setError("From Date cannot be later than To Date.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await fetch(
                `${API_URL}/reports/data?${buildQuery()}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error("Unable to generate report.");
            }

            const data = await response.json();
            setRows(data.rows || []);
        } catch (err) {
            setError(err.message);
            setRows([]);
        } finally {
            setLoading(false);
        }
    };

    const downloadReport = async (format) => {
        if (fromDate && toDate && fromDate > toDate) {
            setError("From Date cannot be later than To Date.");
            return;
        }

        setError("");

        try {
            const response = await fetch(
                `${API_URL}/reports/export?${buildQuery()}&format=${format}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error("Unable to download report.");
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");

            link.href = url;
            link.download = `employee-report.${format}`;
            document.body.appendChild(link);
            link.click();
            link.remove();

            window.URL.revokeObjectURL(url);
        } catch (err) {
            setError(err.message);
        }
    };

    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

    const handleReset = () => {
        setFromDate("");
        setToDate("");
        setDepartment("");
        setEmployeeStatus("");
        setAttendanceStatus("");
        setRows([]);
        setError("");
    };

    return (
        <div className="dashboard-layout">
            <Sidebar activePage="reports" />

            <main className="reports-main">
                <div className="reports-header">
                    <div>
                        <h1>Reports & Analytics</h1>
                        <p>Generate and download employee and attendance reports.</p>
                    </div>
                </div>

                <div className="reports-filter-card">
                    <h3>Report Filters</h3>

                    <div className="reports-filter-grid">
                        <div className="reports-field">
                            <label>Report Type</label>
                            <select
                                value={reportType}
                                onChange={(e) => {
                                    setReportType(e.target.value);
                                    setRows([]);
                                }}
                            >
                                {reportOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="reports-field">
                            <label>From Date</label>
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                            />
                        </div>

                        <div className="reports-field">
                            <label>To Date</label>
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                            />
                        </div>

                        <div className="reports-field">
                            <label>Department</label>
                            <input
                                type="text"
                                placeholder="Enter department"
                                value={department}
                                onChange={(e) => setDepartment(e.target.value)}
                            />
                        </div>

                        <div className="reports-field">
                            <label>Employee Status</label>
                            <select
                                value={employeeStatus}
                                onChange={(e) => setEmployeeStatus(e.target.value)}
                            >
                                <option value="">All Statuses</option>
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>

                        <div className="reports-field">
                            <label>Attendance Status</label>
                            <select
                                value={attendanceStatus}
                                onChange={(e) => setAttendanceStatus(e.target.value)}
                            >
                                <option value="">All Attendance</option>
                                <option value="Present">Present</option>
                                <option value="Absent">Absent</option>
                                <option value="Late">Late</option>
                                <option value="Half Day">Half Day</option>
                            </select>
                        </div>
                    </div>

                    <div className="reports-filter-actions">
                        <button
                            className="reports-reset-btn"
                            onClick={handleReset}
                        >
                            Reset Filters
                        </button>

                        <button
                            className="reports-generate-btn"
                            onClick={generateReport}
                            disabled={loading}
                        >
                            {loading ? "Generating..." : "Generate Report"}
                        </button>
                    </div>
                </div>

                {error && <div className="reports-error">{error}</div>}

                <div className="reports-table-card">
                    <div className="reports-table-header">
                        <div>
                            <h3>Report Results</h3>
                            <p>{rows.length} records found</p>
                        </div>

                        <div className="reports-export-actions">
                            <button onClick={() => downloadReport("pdf")}>
                                Download PDF
                            </button>
                            <button onClick={() => downloadReport("xlsx")}>
                                Export Excel
                            </button>
                            <button onClick={() => downloadReport("csv")}>
                                Export CSV
                            </button>
                        </div>
                    </div>

                    <div className="reports-table-wrapper">
                        <table className="reports-table">
                            <thead>
                                <tr>
                                    {columns.map((column) => (
                                        <th key={column}>{column.replaceAll("_", " ")}</th>
                                    ))}
                                </tr>
                            </thead>

                            <tbody>
                                {rows.length > 0 ? (
                                    rows.map((row, index) => (
                                        <tr key={index}>
                                            {columns.map((column) => (
                                                <td key={column}>
                                                    {row[column] ?? "-"}
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={Math.max(columns.length, 1)}>
                                            Generate a report to view the results.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Reports;
