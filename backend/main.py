
from routers.reports import router as reports_router

from fastapi import (
    FastAPI,
    Depends,
    HTTPException,
    Query
)

from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_
from sqlalchemy.exc import IntegrityError

from datetime import datetime, date as Date, time, timedelta
from zoneinfo import ZoneInfo

from math import ceil

from database import get_db
from models import User, Employee, Attendance

from schemas import (
    RegisterSchema,
    LoginSchema,
    EmployeeCreateSchema,
    AttendanceCreateSchema
)

from auth import (
    hash_password,
    verify_password,
    create_access_token,
    verify_access_token
)

from attendance_scheduler import (
    start_attendance_scheduler,
    stop_attendance_scheduler
)

app = FastAPI()

# --------------------------------------------------
# CORS CONFIGURATION
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

# --------------------------------------------------
# HELPER FUNCTION - EMPLOYEE RESPONSE
# --------------------------------------------------

def employee_response(emp):

    return {
        "employee_id": emp.employee_id,
        "full_name": emp.full_name,
        "email": emp.email,
        "mobile": emp.mobile,
        "department": emp.department,
        "designation": emp.designation,
        "joining_date": emp.joining_date,
        "status": emp.status
    }

# --------------------------------------------------
# REGISTER - Uses employee.users
# --------------------------------------------------

@app.post("/register")
def register_user(
    data: RegisterSchema,
    db: Session = Depends(get_db)
):

    if data.password != data.confirm_password:
        raise HTTPException(
            status_code=400,
            detail="Passwords do not match."
        )

    existing_user = db.query(User).filter(
        func.lower(User.email) == data.email.lower()
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=409,
            detail="Email already registered. Please login."
        )

    new_user = User(
        full_name=data.full_name,
        email=data.email.lower(),
        mobile=data.mobile,
        password=hash_password(data.password)
    )

    try:

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

    except IntegrityError:

        db.rollback()

        raise HTTPException(
            status_code=409,
            detail="Email already registered. Please login."
        )

    return {
        "message": "Registration successful.",
        "user_id": new_user.user_id,
        "full_name": new_user.full_name
    }

# --------------------------------------------------
# LOGIN - Uses employee.users
# --------------------------------------------------

@app.post("/login")
def login_user(
    data: LoginSchema,
    db: Session = Depends(get_db)
):
    # Find registered user
    login_email = data.email.strip().lower()

    user = db.query(User).filter(
        func.lower(func.trim(User.email)) == login_email
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Email not found. Please sign up first."
        )

    # Verify password
    if not verify_password(data.password, user.password):
        raise HTTPException(
            status_code=401,
            detail="Incorrect password. Please try again."
        )

    # Find matching active, non-deleted employee
    employee = db.query(Employee).filter(
        func.lower(func.trim(Employee.email)) ==
        func.lower(func.trim(user.email)),
        func.lower(func.trim(Employee.status)) == "active",
        Employee.is_deleted.is_(False)
    ).first()

    # Prevent inactive or permanently removed employees from logging in
    if not employee:
        raise HTTPException(
            status_code=403,
            detail="Your employee account is inactive or removed. Please contact the administrator."
        )

    # Record automatic attendance check-in
    now = get_indian_time()
    today = now.date()

    check_in_time = now.time().replace(
        tzinfo=None,
        microsecond=0
    )

    attendance = db.query(Attendance).filter(
        Attendance.employee_id == employee.employee_id,
        Attendance.attendance_date == today
    ).first()

    if not attendance:
        attendance = Attendance(
            employee_id=employee.employee_id,
            attendance_date=today,
            check_in=check_in_time,
            status=(
                "Present"
                if now.time() <= time(9, 45)
                else "Late"
            )
        )

        db.add(attendance)

        print(
            f"Attendance created: {employee.full_name}, "
            f"Check-in: {check_in_time}"
        )

    elif not attendance.check_in:
        attendance.check_in = check_in_time

        attendance.status = (
            "Present"
            if now.time() <= time(9, 45)
            else "Late"
        )

        print(
            f"Attendance check-in updated: "
            f"{employee.full_name}, {check_in_time}"
        )

    else:
        print(
            f"Existing check-in preserved for "
            f"{employee.full_name}: {attendance.check_in}"
        )

    db.commit()

    # Generate JWT token
    token = create_access_token(user.user_id)

    return {
        "message": "Login successful.",
        "access_token": token,
        "token_type": "bearer",
        "user_id": user.user_id,
        "full_name": user.full_name,
        "email": user.email
    }

# --------------------------------------------------
# AUTHENTICATION - GET LOGGED-IN USER
# --------------------------------------------------

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):

    token = credentials.credentials

    user_id = verify_access_token(token)

    if user_id is None:

        raise HTTPException(
            status_code=401,
            detail="Invalid or expired session. Please login again."
        )

    user = db.query(User).filter(
        User.user_id == user_id
    ).first()

    if not user:

        raise HTTPException(
            status_code=401,
            detail="User account not found."
        )

    return user

app.include_router(
    reports_router,
    dependencies=[Depends(get_current_user)]
)

# --------------------------------------------------
# GET LOGGED-IN USER DETAILS
# --------------------------------------------------

@app.get("/auth/me")
def get_logged_in_user(
    current_user: User = Depends(get_current_user)
):

    return {
        "user_id": current_user.user_id,
        "full_name": current_user.full_name,
        "email": current_user.email
    }

# --------------------------------------------------
# ADD EMPLOYEE
# POST /employees
# --------------------------------------------------

@app.post("/employees")
def add_employee(
    data: EmployeeCreateSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if data.status not in ["Active", "Inactive"]:
        raise HTTPException(
            status_code=400,
            detail="Status must be Active or Inactive."
        )

    # Normalize email before checking and saving.
    employee_email = data.email.strip().lower()

    # Check duplicate email only in the employees table.
    existing_employee = db.query(Employee).filter(
        func.lower(func.trim(Employee.email)) == employee_email
    ).first()

    if existing_employee:
        raise HTTPException(
            status_code=409,
            detail="Employee email already exists."
        )

    new_employee = Employee(
        full_name=data.full_name.strip(),
        email=employee_email,
        mobile=data.mobile.strip(),
        department=data.department.strip(),
        designation=data.designation.strip(),
        joining_date=data.joining_date or date.today(),
        status=data.status
    )

    try:
        db.add(new_employee)
        db.commit()
        db.refresh(new_employee)

    except IntegrityError as exc:
        db.rollback()

        # Log the actual PostgreSQL error in the backend terminal.
        print("DATABASE INTEGRITY ERROR:", str(exc.orig))

        error_message = str(exc.orig).lower()

        if "employees_email" in error_message or (
            "duplicate key" in error_message
            and "email" in error_message
        ):
            raise HTTPException(
                status_code=409,
                detail="Employee email already exists."
            )

        raise HTTPException(
            status_code=500,
            detail="Unable to save employee due to a database constraint error."
        )

    return {
        "message": "Employee added successfully.",
        "employee_id": new_employee.employee_id,
        "full_name": new_employee.full_name
    }

# --------------------------------------------------
# GET EMPLOYEES
# --------------------------------------------------

@app.get("/employees")
def get_employees(
    search: str = Query(default=""),
    department: str = Query(default=""),
    status: str = Query(default="All"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Exclude permanently deleted employees
    query = db.query(Employee).filter(
        Employee.is_deleted.is_(False)
    )

    # Search by employee name or email
    if search.strip():
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Employee.full_name.ilike(search_term),
                Employee.email.ilike(search_term)
            )
        )

    # Department filter
    if department.strip() and department.lower() != "all":
        query = query.filter(
            Employee.department == department
        )

    # Status filter
    if status.lower() in ["active", "inactive"]:
        query = query.filter(
            func.lower(Employee.status) == status.lower()
        )
    elif status.lower() != "all":
        raise HTTPException(
            status_code=400,
            detail="Invalid employee status filter."
        )

    # Total filtered records
    total = query.count()
    total_pages = ceil(total / page_size) if total > 0 else 0

    # Fetch current page
    employees = query.order_by(
        Employee.employee_id.desc()
    ).offset(
        (page - 1) * page_size
    ).limit(page_size).all()

    # Department dropdown options
    departments = db.query(
        Employee.department
    ).filter(
        Employee.is_deleted.is_(False),
        Employee.department.isnot(None),
        func.trim(Employee.department) != "",
        func.lower(func.trim(Employee.department)) != "not assigned"
    ).distinct().order_by(
        Employee.department
    ).all()

    department_list = [item[0] for item in departments]

    return {
        "items": [
            employee_response(emp)
            for emp in employees
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "departments": department_list
    }


# --------------------------------------------------
# GET RECENT EMPLOYEES - DASHBOARD
# --------------------------------------------------

@app.get("/employees/recent")
def get_recent_employees(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    employees = db.query(Employee).filter(
        Employee.is_deleted.is_(False)
    ).order_by(
        Employee.employee_id.desc()
    ).limit(5).all()

    return [
        employee_response(emp)
        for emp in employees
    ]


# --------------------------------------------------
# DASHBOARD STATISTICS
# --------------------------------------------------

@app.get("/dashboard/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Exclude permanently deleted employees
    visible_employees = db.query(Employee).filter(
        Employee.is_deleted.is_(False)
    )

    total_employees = visible_employees.count()

    active_employees = visible_employees.filter(
        func.lower(Employee.status) == "active"
    ).count()

    inactive_employees = visible_employees.filter(
        func.lower(Employee.status) == "inactive"
    ).count()

    department_filter = [
        Employee.is_deleted.is_(False),
        Employee.department.isnot(None),
        func.trim(Employee.department) != "",
        func.lower(func.trim(Employee.department)) != "not assigned"
    ]

    department_count = db.query(
        func.count(func.distinct(Employee.department))
    ).filter(
        *department_filter
    ).scalar() or 0

    department_data = db.query(
        Employee.department,
        func.count(Employee.employee_id)
    ).filter(
        *department_filter
    ).group_by(
        Employee.department
    ).all()

    department_stats = [
        {
            "department": department,
            "count": count
        }
        for department, count in department_data
    ]

    return {
        "total_employees": total_employees,
        "active_employees": active_employees,
        "inactive_employees": inactive_employees,
        "department_count": department_count,
        "department_stats": department_stats
    }


# --------------------------------------------------
# UPDATE EMPLOYEE
# PUT /employees/{employee_id}
# --------------------------------------------------

@app.put("/employees/{employee_id}")
def update_employee(
    employee_id: int,
    data: EmployeeCreateSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if data.status not in ["Active", "Inactive"]:
        raise HTTPException(
            status_code=400,
            detail="Status must be Active or Inactive."
        )

    employee = db.query(Employee).filter(
        Employee.employee_id == employee_id,
        Employee.is_deleted.is_(False)
    ).first()

    if not employee:
        raise HTTPException(
            status_code=404,
            detail="Employee not found."
        )

    # Check whether another employee uses this email
    existing_employee = db.query(Employee).filter(
        func.lower(Employee.email) == data.email.lower(),
        Employee.employee_id != employee_id
    ).first()

    if existing_employee:
        raise HTTPException(
            status_code=409,
            detail="Employee email already exists."
        )

    employee.full_name = data.full_name
    employee.email = data.email.lower()
    employee.mobile = data.mobile
    employee.department = data.department
    employee.designation = data.designation
    employee.joining_date = data.joining_date or employee.joining_date
    employee.status = data.status

    try:
        db.commit()
        db.refresh(employee)

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Employee email already exists."
        )

    return {
        "message": "Employee updated successfully.",
        "employee": employee_response(employee)
    }


# --------------------------------------------------
# SOFT DELETE EMPLOYEE
# DELETE /employees/{employee_id}
# Changes status to Inactive
# --------------------------------------------------

@app.delete("/employees/{employee_id}")
def delete_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    employee = db.query(Employee).filter(
        Employee.employee_id == employee_id,
        Employee.is_deleted.is_(False)
    ).first()

    if not employee:
        raise HTTPException(
            status_code=404,
            detail="Employee not found."
        )

    if employee.status == "Inactive":
        raise HTTPException(
            status_code=400,
            detail="Employee is already inactive."
        )

    employee.status = "Inactive"
    db.commit()

    return {
        "message": "Employee moved to inactive status successfully."
    }


# --------------------------------------------------
# PERMANENT DELETE EMPLOYEE
# DELETE /employees/{employee_id}/permanent
# Hides employee from EMS portal.
# Database and attendance records are retained.
# --------------------------------------------------

@app.delete("/employees/{employee_id}/permanent")
def permanently_delete_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    employee = db.query(Employee).filter(
        Employee.employee_id == employee_id,
        Employee.is_deleted.is_(False)
    ).first()

    if not employee:
        raise HTTPException(
            status_code=404,
            detail="Employee not found."
        )

    # Hide employee from EMS and retain database records
    employee.status = "Inactive"
    employee.is_deleted = True

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to permanently delete employee."
        )

    return {
        "message": "Employee permanently removed from the EMS portal. Database and attendance records have been retained."
    }

# --------------------------------------------------
# SAVE ATTENDANCE
# POST /attendance
# --------------------------------------------------

@app.post("/attendance")
def save_attendance(
    data: AttendanceCreateSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    valid_statuses = ["Present", "Absent", "Late", "Half Day"]

    if data.status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail="Invalid attendance status."
        )

    employee = db.query(Employee).filter(
        Employee.employee_id == data.employee_id,
        func.lower(Employee.status) == "active",
        Employee.is_deleted.is_(False)
    ).first()

    if not employee:
        raise HTTPException(
            status_code=404,
            detail="Active employee not found."
        )

    attendance = db.query(Attendance).filter(
        Attendance.employee_id == data.employee_id,
        Attendance.attendance_date == data.attendance_date
    ).first()

    if attendance:
        attendance.status = data.status
        attendance.check_in = data.check_in
        attendance.check_out = data.check_out
    else:
        attendance = Attendance(
            employee_id=data.employee_id,
            attendance_date=data.attendance_date,
            status=data.status,
            check_in=data.check_in,
            check_out=data.check_out
        )
        db.add(attendance)

    db.commit()
    db.refresh(attendance)

    return {
        "message": "Attendance saved successfully.",
        "attendance_id": attendance.attendance_id,
        "employee_id": attendance.employee_id,
        "attendance_date": attendance.attendance_date,
        "status": attendance.status
    }


# --------------------------------------------------
# GET ATTENDANCE
# GET /attendance
# --------------------------------------------------

@app.get("/attendance")
def get_attendance(
    attendance_date: Date = Query(default=None, alias="date"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    selected_date = attendance_date or get_indian_time().date()

    records = db.query(
        Employee,
        Attendance
    ).outerjoin(
        Attendance,
        and_(
            Attendance.employee_id == Employee.employee_id,
            Attendance.attendance_date == selected_date
        )
    ).filter(
        func.lower(Employee.status) == "active",
        Employee.is_deleted.is_(False)
    ).order_by(
        Employee.employee_id
    ).all()

    return [
        {
            "attendance_id": attendance.attendance_id if attendance else None,
            "employee_id": employee.employee_id,
            "full_name": employee.full_name,
            "department": employee.department,
            "check_in": attendance.check_in if attendance else None,
            "check_out": attendance.check_out if attendance else None,
            "status": attendance.status if attendance else "Not Marked"
        }
        for employee, attendance in records
    ]

def get_indian_time():
    return datetime.now(ZoneInfo("Asia/Kolkata"))


def calculate_attendance_status(check_in, check_out):
    if not check_in or not check_out:
        return None

    working_duration = (
        datetime.combine(datetime.today(), check_out)
        - datetime.combine(datetime.today(), check_in)
    )

    if working_duration <= timedelta(hours=4):
        return "Half Day"

    # Retain the original Present or Late status
    return None

@app.post("/logout")
def logout_user(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    employee = db.query(Employee).filter(
    func.lower(Employee.email) == current_user.email.lower(),
    func.lower(Employee.status) == "active",
    Employee.is_deleted.is_(False)
).first()

    if employee:
        now = get_indian_time()
        today = now.date()

        attendance = db.query(Attendance).filter(
            Attendance.employee_id == employee.employee_id,
            Attendance.attendance_date == today
        ).first()

        if attendance and attendance.check_in and not attendance.check_out:

            check_out_time = now.time().replace(
                tzinfo=None,
                microsecond=0
            )

            attendance.check_out = check_out_time

            # Calculate working duration
            duration = (
                datetime.combine(today, check_out_time)
                - datetime.combine(today, attendance.check_in)
            )

            # Four hours or less = Half Day
            if duration <= timedelta(hours=4):
                attendance.status = "Half Day"

            # More than four hours = retain Present or Late

            db.commit()

    return {
        "message": "Logged out successfully. Attendance updated."
    }

@app.on_event("startup")
def start_scheduler():
    start_attendance_scheduler()


@app.on_event("shutdown")
def stop_scheduler():
    stop_attendance_scheduler()