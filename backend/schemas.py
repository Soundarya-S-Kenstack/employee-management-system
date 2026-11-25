
from pydantic import BaseModel, EmailStr, Field
from datetime import date, time
from typing import Optional

class RegisterSchema(BaseModel):
    full_name: str = Field(min_length=3, max_length=100)
    email: EmailStr
    mobile: str = Field(pattern=r"^[0-9]{10}$")
    password: str = Field(min_length=8)
    confirm_password: str = Field(min_length=8)

class LoginSchema(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)

class EmployeeCreateSchema(BaseModel):
    full_name: str = Field(min_length=3, max_length=100)
    email: EmailStr
    mobile: str = Field(pattern=r"^[0-9]{10}$")
    department: str = Field(min_length=1, max_length=100)
    designation: str = Field(min_length=1, max_length=100)
    joining_date: Optional[date] = None
    status: str = "Active"

class AttendanceCreateSchema(BaseModel):
    employee_id: int
    attendance_date: date
    status: str
    check_in: Optional[time] = None
    check_out: Optional[time] = None