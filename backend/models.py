
from sqlalchemy import Column, Integer, String, DateTime, Date, func
from database import Base


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
