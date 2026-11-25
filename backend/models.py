
from sqlalchemy import Column, Integer, String, DateTime, Date, func
from database import Base
from sqlalchemy import Time, ForeignKey, UniqueConstraint, Boolean

# User table - Registration and Login
class User(Base):
    __tablename__ = "users"
    __table_args__ = {"schema": "employee"}

    user_id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    mobile = Column(String(10), nullable=False)
    password = Column(String(255), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

# Employee table - Employee Management
class Employee(Base):
    __tablename__ = "employees"
    __table_args__ = {"schema": "employee"}

    employee_id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    mobile = Column(String(10), nullable=False)
    department = Column(String(100), default="Not Assigned")
    designation = Column(String(100), default="Not Assigned")
    joining_date = Column(Date, server_default=func.current_date())
    status = Column(String(20), default="Active")
    created_at = Column(DateTime, server_default=func.now())
    is_deleted = Column(Boolean, default=False, nullable=False)

class Attendance(Base):
    __tablename__ = "attendance"

    __table_args__ = (
        UniqueConstraint(
            "employee_id",
            "attendance_date",
            name="unique_employee_attendance"
        ),
        {"schema": "employee"}
    )

    attendance_id = Column(Integer, primary_key=True, index=True)

    employee_id = Column(
        Integer,
        ForeignKey("employee.employees.employee_id"),
        nullable=False
    )

    attendance_date = Column(Date, nullable=False)

    check_in = Column(Time, nullable=True)
    check_out = Column(Time, nullable=True)

    status = Column(String(20), nullable=False, default="Absent")

    created_at = Column(DateTime, server_default=func.now())