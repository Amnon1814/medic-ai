from datetime import datetime

from sqlalchemy import (
    String,
    Integer,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    Text
)

from sqlalchemy.orm import Mapped, mapped_column

from .db import Base


# ============================================================
# USER MODEL
# ============================================================

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True
    )

    hashed_password: Mapped[str] = mapped_column(String(255))

    full_name: Mapped[str] = mapped_column(
        String(120),
        default=""
    )

    age: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True
    )

    sex: Mapped[str] = mapped_column(
        String(20),
        default=""
    )

    language: Mapped[str] = mapped_column(
        String(5),
        default="en"
    )

    consent: Mapped[bool] = mapped_column(
        Boolean,
        default=False
    )

    allergies: Mapped[str] = mapped_column(
        Text,
        default=""
    )

    emergency_contact: Mapped[str] = mapped_column(
        String(120),
        default=""
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )


# ============================================================
# VITALS MODEL
# ============================================================

class Vital(Base):
    __tablename__ = "vitals"

    id: Mapped[int] = mapped_column(primary_key=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        index=True
    )

    kind: Mapped[str] = mapped_column(
        String(20)
    )

    value: Mapped[float] = mapped_column(Float)

    value2: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )


# ============================================================
# MEDICAL RECORD MODEL
# ============================================================

class Record(Base):
    __tablename__ = "records"

    id: Mapped[int] = mapped_column(primary_key=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        index=True
    )

    category: Mapped[str] = mapped_column(
        String(30)
    )

    title: Mapped[str] = mapped_column(
        String(200)
    )

    content: Mapped[str] = mapped_column(
        Text,
        default=""
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )


# ============================================================
# REMINDER MODEL
# ============================================================

class Reminder(Base):
    __tablename__ = "reminders"

    id: Mapped[int] = mapped_column(primary_key=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        index=True
    )

    medicine: Mapped[str] = mapped_column(
        String(120)
    )

    time_of_day: Mapped[str] = mapped_column(
        String(5)
    )

    active: Mapped[bool] = mapped_column(
        Boolean,
        default=True
    )


# ============================================================
# MEDICATION MODEL
# ============================================================

class Medication(Base):
    __tablename__ = "medications"

    id: Mapped[int] = mapped_column(primary_key=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        index=True
    )

    medicine: Mapped[str] = mapped_column(
        String(150)
    )

    dosage: Mapped[str] = mapped_column(
        String(100)
    )

    frequency: Mapped[str] = mapped_column(
        String(50)
    )

    times: Mapped[str] = mapped_column(
        Text,
        default=""
    )

    instructions: Mapped[str] = mapped_column(
        Text,
        default=""
    )

    start_date: Mapped[str] = mapped_column(
        String(10)
    )

    end_date: Mapped[str | None] = mapped_column(
        String(10),
        nullable=True
    )

    status: Mapped[str] = mapped_column(
        String(20),
        default="active"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )