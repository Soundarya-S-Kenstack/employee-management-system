
from datetime import datetime
from zoneinfo import ZoneInfo

from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.exc import IntegrityError

from database import SessionLocal
from models import Employee, Attendance


IST = ZoneInfo("Asia/Kolkata")

scheduler = BackgroundScheduler(timezone=IST)


def mark_absent_employees():
    db = SessionLocal()

    try:
        # Get today's date in Indian Standard Time
        today = datetime.now(IST).date()

        # Get all active employees
        employees = db.query(Employee).filter(
            Employee.status == "Active"
        ).all()

        marked_count = 0

        for employee in employees:

            # Find existing attendance for today
            existing_attendance = db.query(Attendance).filter(
                Attendance.employee_id == employee.employee_id,
                Attendance.attendance_date == today
            ).first()

            # If no attendance record exists, mark Absent
            if existing_attendance is None:

                absent_record = Attendance(
                    employee_id=employee.employee_id,
                    attendance_date=today,
                    check_in=None,
                    check_out=None,
                    status="Absent"
                )

                db.add(absent_record)
                marked_count += 1

            # If an attendance record already exists,
            # do not change its status or login/logout times.
            # This keeps employees who logged in but did not
            # log out as Present.

        db.commit()

        print(
            f"[Attendance Scheduler] {marked_count} employees "
            f"marked Absent for {today}"
        )

    except IntegrityError:
        db.rollback()

        print(
            "[Attendance Scheduler] Duplicate attendance prevented."
        )

    except Exception as error:
        db.rollback()

        print(
            f"[Attendance Scheduler] Error: {error}"
        )

    finally:
        db.close()


def start_attendance_scheduler():

    if not scheduler.running:

        scheduler.add_job(
            mark_absent_employees,
            trigger="cron",
            hour=23,
            minute=59,
            id="daily_absent_marking",
            replace_existing=True,
            coalesce=True,
            max_instances=1,
            misfire_grace_time=3600
        )

        scheduler.start()

        print(
            "Attendance scheduler started. "
            "Daily absence marking: 11:59 PM IST."
        )


def stop_attendance_scheduler():

    if scheduler.running:

        scheduler.shutdown(wait=False)

        print("Attendance scheduler stopped.")
