import csv
import io
from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle

from database import get_db
from models import Employee, Attendance


router = APIRouter(
    prefix="/reports",
    tags=["Reports"]
)


ALLOWED_REPORTS = {
    "employee_overview",
    "department_wise",
    "daily_attendance",
    "monthly_attendance",
    "joining",
    "employee_status",
    "late_arrival",
    "absence",
    "working_hours"
}


def to_string(value):
    if value is None:
        return ""

    if isinstance(value, (date, datetime)):
        return value.isoformat()

    return str(value)


def get_report_rows(
    db: Session,
    report_type: str,
    from_date=None,
    to_date=None,
    department=None,
    employee_status=None,
    attendance_status=None
):
    if report_type not in ALLOWED_REPORTS:
        raise HTTPException(
            status_code=400,
            detail="Invalid report type"
        )

    # EMPLOYEE REPORTS
    employee_reports = {
        "employee_overview",
        "department_wise",
        "joining",
        "employee_status"
    }

    if report_type in employee_reports:

        query = db.query(Employee).filter(
            Employee.is_deleted == False
        )

        if department:
            query = query.filter(
                Employee.department.ilike(f"%{department}%")
            )

        if employee_status:
            query = query.filter(
                Employee.status == employee_status
            )

        # Date filters apply to employee joining dates.
        if from_date:
            query = query.filter(
                Employee.joining_date >= from_date
            )

        if to_date:
            query = query.filter(
                Employee.joining_date <= to_date
            )

        employees = query.order_by(
            Employee.employee_id.desc()
        ).all()

        # DEPARTMENT-WISE REPORT
        if report_type == "department_wise":

            department_data = {}

            for employee in employees:

                name = employee.department or "Not Assigned"

                if name not in department_data:
                    department_data[name] = {
                        "department": name,
                        "total_employees": 0,
                        "active_employees": 0,
                        "inactive_employees": 0
                    }

                department_data[name]["total_employees"] += 1

                if employee.status == "Active":
                    department_data[name]["active_employees"] += 1
                else:
                    department_data[name]["inactive_employees"] += 1

            return list(department_data.values())

        # EMPLOYEE OVERVIEW, JOINING AND STATUS REPORTS
        return [
            {
                "employee_id": employee.employee_id,
                "full_name": employee.full_name,
                "email": employee.email,
                "mobile": employee.mobile,
                "department": employee.department,
                "designation": employee.designation,
                "joining_date": to_string(employee.joining_date),
                "status": employee.status
            }
            for employee in employees
        ]

    # ATTENDANCE REPORTS
    query = (
        db.query(Attendance, Employee)
        .join(
            Employee,
            Attendance.employee_id == Employee.employee_id
        )
        .filter(Employee.is_deleted == False)
    )

    if department:
        query = query.filter(
            Employee.department.ilike(f"%{department}%")
        )

    if employee_status:
        query = query.filter(
            Employee.status == employee_status
        )

    # Default daily attendance date is today.
    if report_type == "daily_attendance" and not from_date and not to_date:
        from_date = date.today()
        to_date = date.today()

    # Default monthly attendance period is the current month.
    if report_type == "monthly_attendance" and not from_date and not to_date:
        today = date.today()
        from_date = today.replace(day=1)

        if today.month == 12:
            next_month = date(today.year + 1, 1, 1)
        else:
            next_month = date(today.year, today.month + 1, 1)

        to_date = next_month - timedelta(days=1)

    if from_date:
        query = query.filter(
            Attendance.attendance_date >= from_date
        )

    if to_date:
        query = query.filter(
            Attendance.attendance_date <= to_date
        )

    if attendance_status:
        query = query.filter(
            Attendance.status == attendance_status
        )

    if report_type == "late_arrival":
        query = query.filter(
            Attendance.status == "Late"
        )

    if report_type == "absence":
        query = query.filter(
            Attendance.status == "Absent"
        )

    records = query.order_by(
        Attendance.attendance_date.desc()
    ).all()

    # MONTHLY ATTENDANCE SUMMARY
    if report_type == "monthly_attendance":

        summary = {}

        for attendance, employee in records:

            employee_id = employee.employee_id

            if employee_id not in summary:
                summary[employee_id] = {
                    "employee_id": employee_id,
                    "employee_name": employee.full_name,
                    "department": employee.department,
                    "present_days": 0,
                    "absent_days": 0,
                    "late_days": 0,
                    "half_days": 0,
                    "total_recorded_days": 0
                }

            item = summary[employee_id]
            item["total_recorded_days"] += 1

            if attendance.status == "Present":
                item["present_days"] += 1

            elif attendance.status == "Absent":
                item["absent_days"] += 1

            elif attendance.status == "Late":
                item["late_days"] += 1

            elif attendance.status == "Half Day":
                item["half_days"] += 1

        result = []

        for item in summary.values():

            total = item["total_recorded_days"]

            attended = (
                item["present_days"]
                + item["late_days"]
                + (item["half_days"] * 0.5)
            )

            item["attendance_percentage"] = (
                round((attended / total) * 100, 2)
                if total else 0
            )

            result.append(item)

        return result

    # DAILY, LATE, ABSENCE AND WORKING HOURS REPORTS
    rows = []

    for attendance, employee in records:

        working_hours = ""

        if attendance.check_in and attendance.check_out:

            start = datetime.combine(
                date.today(),
                attendance.check_in
            )

            end = datetime.combine(
                date.today(),
                attendance.check_out
            )

            if end < start:
                end += timedelta(days=1)

            duration = end - start

            minutes = int(duration.total_seconds() // 60)

            working_hours = (
                f"{minutes // 60}h {minutes % 60}m"
            )

        row = {
            "employee_id": employee.employee_id,
            "employee_name": employee.full_name,
            "department": employee.department,
            "designation": employee.designation,
            "attendance_date": to_string(
                attendance.attendance_date
            ),
            "check_in": to_string(attendance.check_in),
            "check_out": to_string(attendance.check_out),
            "attendance_status": attendance.status
        }

        if report_type == "working_hours":
            row["working_hours"] = working_hours

        rows.append(row)

    return rows


@router.get("/data")
def get_report_data(
    report_type: str = Query(...),
    from_date: date = None,
    to_date: date = None,
    department: str = None,
    employee_status: str = None,
    attendance_status: str = None,
    db: Session = Depends(get_db)
):

    if from_date and to_date and from_date > to_date:
        raise HTTPException(
            status_code=400,
            detail="From date cannot be later than To date"
        )

    rows = get_report_rows(
        db=db,
        report_type=report_type,
        from_date=from_date,
        to_date=to_date,
        department=department,
        employee_status=employee_status,
        attendance_status=attendance_status
    )

    return {
        "report_type": report_type,
        "total_records": len(rows),
        "rows": rows
    }


@router.get("/export")
def export_report(
    report_type: str = Query(...),
    format: str = Query(...),
    from_date: date = None,
    to_date: date = None,
    department: str = None,
    employee_status: str = None,
    attendance_status: str = None,
    db: Session = Depends(get_db)
):

    if format not in {"pdf", "xlsx", "csv"}:
        raise HTTPException(
            status_code=400,
            detail="Supported formats are pdf, xlsx and csv"
        )

    if from_date and to_date and from_date > to_date:
        raise HTTPException(
            status_code=400,
            detail="From date cannot be later than To date"
        )

    rows = get_report_rows(
        db=db,
        report_type=report_type,
        from_date=from_date,
        to_date=to_date,
        department=department,
        employee_status=employee_status,
        attendance_status=attendance_status
    )

    if not rows:
        raise HTTPException(
            status_code=404,
            detail="No records found for the selected filters"
        )

    columns = list(rows[0].keys())

    filename = f"{report_type}_report.{format}"

    # CSV EXPORT
    if format == "csv":

        output = io.StringIO()

        writer = csv.writer(output)
        writer.writerow(columns)

        for row in rows:
            writer.writerow([
                to_string(row.get(column))
                for column in columns
            ])

        content = io.BytesIO(
            output.getvalue().encode("utf-8-sig")
        )

        return StreamingResponse(
            content,
            media_type="text/csv",
            headers={
                "Content-Disposition":
                    f'attachment; filename="{filename}"'
            }
        )

    # EXCEL EXPORT
    if format == "xlsx":

        workbook = Workbook()
        worksheet = workbook.active
        worksheet.title = "Report"

        worksheet.append(columns)

        for row in rows:
            worksheet.append([
                to_string(row.get(column))
                for column in columns
            ])

        for cell in worksheet[1]:
            cell.font = Font(bold=True, color="FFFFFF")
            cell.fill = PatternFill(
                start_color="6255CE",
                end_color="6255CE",
                fill_type="solid"
            )

        for column_cells in worksheet.columns:

            max_length = max(
                len(str(cell.value or ""))
                for cell in column_cells
            )

            worksheet.column_dimensions[
                column_cells[0].column_letter
            ].width = min(max_length + 3, 35)

        output = io.BytesIO()
        workbook.save(output)
        output.seek(0)

        return StreamingResponse(
            output,
            media_type=(
                "application/vnd.openxmlformats-officedocument."
                "spreadsheetml.sheet"
            ),
            headers={
                "Content-Disposition":
                    f'attachment; filename="{filename}"'
            }
        )

    # PDF EXPORT
    output = io.BytesIO()

    document = SimpleDocTemplate(
        output,
        pagesize=landscape(A4)
    )

    table_data = [columns]

    for row in rows:
        table_data.append([
            to_string(row.get(column))
            for column in columns
        ])

    table = Table(
        table_data,
        repeatRows=1
    )

    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#6255CE")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("PADDING", (0, 0), (-1, -1), 6),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE")
    ]))

    document.build([table])
    output.seek(0)

    return StreamingResponse(
        output,
        media_type="application/pdf",
        headers={
            "Content-Disposition":
                f'attachment; filename="{filename}"'
        }
    )