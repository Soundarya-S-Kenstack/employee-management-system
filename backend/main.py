
from fastapi import (
    FastAPI,
    Depends,
    HTTPException,
    Query
)

from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from sqlalchemy.exc import IntegrityError

from datetime import date
from math import ceil

from database import get_db
from models import User, Employee

from schemas import (
    RegisterSchema,
    LoginSchema,
    EmployeeCreateSchema
)

from auth import (
    hash_password,
    verify_password,
    create_access_token,
    verify_access_token
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

    user = db.query(User).filter(
        func.lower(User.email) == data.email.lower()
    ).first()

    if not user:

        raise HTTPException(
            status_code=404,
            detail="Email not found. Please sign up first."
        )

    if not verify_password(data.password, user.password):

        raise HTTPException(
            status_code=401,
            detail="Incorrect password. Please try again."
        )

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
# SEARCH + FILTER + PAGINATION
# GET /employees
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

    query = db.query(Employee)

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

    # Pagination calculation
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
        Employee.department.isnot(None),
        func.trim(Employee.department) != "",
        func.lower(func.trim(Employee.department)) != "not assigned"
    ).distinct().order_by(
        Employee.department
    ).all()

    department_list = [
        item[0] for item in departments
    ]

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

    employees = db.query(Employee).order_by(
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

    total_employees = db.query(Employee).count()

    active_employees = db.query(Employee).filter(
        func.lower(Employee.status) == "active"
    ).count()

    inactive_employees = db.query(Employee).filter(
        func.lower(Employee.status).in_(
            ["inactive", "deleted", "removed"]
        )
    ).count()

    department_count = db.query(
        func.count(func.distinct(Employee.department))
    ).filter(
        Employee.department.isnot(None),
        func.trim(Employee.department) != "",
        func.lower(func.trim(Employee.department)) != "not assigned"
    ).scalar() or 0

    department_data = db.query(
        Employee.department,
        func.count(Employee.employee_id)
    ).filter(
        Employee.department.isnot(None),
        func.trim(Employee.department) != "",
        func.lower(func.trim(Employee.department)) != "not assigned"
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
        Employee.employee_id == employee_id
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
# --------------------------------------------------

@app.delete("/employees/{employee_id}")
def delete_employee(

    employee_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(get_current_user)

):

    employee = db.query(Employee).filter(
        Employee.employee_id == employee_id
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

    # Soft delete - record remains in PostgreSQL
    employee.status = "Inactive"

    db.commit()

    return {
        "message": "Employee moved to inactive status successfully."
    }

# --------------------------------------------------
# PERMANENT DELETE EMPLOYEE
# DELETE /employees/{employee_id}/permanent
# --------------------------------------------------

@app.delete("/employees/{employee_id}/permanent")
def permanently_delete_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    employee = db.query(Employee).filter(
        Employee.employee_id == employee_id
    ).first()

    if not employee:
        raise HTTPException(
            status_code=404,
            detail="Employee not found."
        )

    try:
        db.delete(employee)
        db.commit()

    except Exception as exc:
        db.rollback()
        print("PERMANENT DELETE ERROR:", str(exc))

        raise HTTPException(
            status_code=500,
            detail="Unable to permanently delete employee."
        )

    return {
        "message": "Employee permanently deleted successfully."
    }
