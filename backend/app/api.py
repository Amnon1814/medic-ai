import os
import json
import uuid
import tempfile

from pathlib import Path
from datetime import date, datetime

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File,
    Form
)

from fastapi.responses import FileResponse
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from . import auth, rag, symptom, report, safety
from .db import get_db
from .models import User, Record, Vital, Medication
from .safety import DISCLAIMER


router = APIRouter(prefix="/api")


# ============================================================
# FILE STORAGE CONFIGURATION
# ============================================================

UPLOAD_DIR = (
    Path(__file__).resolve().parent.parent
    / "uploads"
    / "records"
)

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

MAX_FILE_SIZE = 10 * 1024 * 1024

SUPPORTED_FILES = {
    "application/pdf": ".pdf",
    "image/png": ".png",
    "image/jpeg": ".jpg"
}


async def read_validated_upload(file: UploadFile):
    ext = SUPPORTED_FILES.get(file.content_type)

    if not ext:
        raise HTTPException(
            status_code=400,
            detail="Only PDF, PNG, JPG and JPEG files are supported."
        )

    chunks = []
    total_size = 0

    while True:
        chunk = await file.read(1024 * 1024)

        if not chunk:
            break

        total_size += len(chunk)

        if total_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail="Maximum file size is 10 MB."
            )

        chunks.append(chunk)

    data = b"".join(chunks)

    if not data:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty."
        )

    # Verify actual file signatures.
    if ext == ".pdf" and not data.startswith(b"%PDF-"):
        raise HTTPException(400, "Invalid PDF file.")

    if ext == ".png" and not data.startswith(
        b"\x89PNG\r\n\x1a\n"
    ):
        raise HTTPException(400, "Invalid PNG file.")

    if ext == ".jpg" and not data.startswith(b"\xff\xd8\xff"):
        raise HTTPException(400, "Invalid JPEG file.")

    return data, ext


# ============================================================
# REQUEST MODELS
# ============================================================

class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8)


class SymptomAssessmentRequest(BaseModel):
    symptoms: str = Field(min_length=1)
    age: int = Field(ge=1, le=120)
    sex: str
    duration: str
    severity: str = Field(
        pattern="^(Mild|Moderate|Severe)$"
    )


class VitalsRequest(BaseModel):
    heartRate: float = Field(gt=0, le=300)
    systolic: float = Field(gt=0, le=300)
    diastolic: float = Field(gt=0, le=200)
    oxygen: float = Field(gt=0, le=100)
    temperature: float = Field(gt=0, le=50)


class MedicationRequest(BaseModel):
    medicine: str = Field(min_length=1, max_length=150)
    dosage: str = Field(min_length=1, max_length=100)
    frequency: str = Field(min_length=1, max_length=50)
    times: list[str] = Field(min_length=1)
    instructions: str = ""
    start_date: date
    end_date: date | None = None


class HealthRecordRequest(BaseModel):
    category: str = Field(min_length=1, max_length=30)
    title: str = Field(min_length=1, max_length=200)
    content: str = ""


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=5000)
    history: list[dict] = Field(default_factory=list)


class ProfileUpdateRequest(BaseModel):
    full_name: str | None = Field(
        default=None,
        min_length=2,
        max_length=120
    )
    email: EmailStr | None = None
    age: int | None = Field(default=None, ge=1, le=120)
    sex: str | None = Field(default=None, max_length=20)
    language: str | None = Field(default=None, max_length=5)
    allergies: str | None = None
    emergency_contact: str | None = Field(
        default=None,
        max_length=120
    )


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=1)
    new_password: str = Field(min_length=8, max_length=72)


# ============================================================
# HEALTH RECORD HELPER FUNCTIONS
# ============================================================

def get_record_metadata(record: Record) -> dict:
    """
    Convert a database record into a frontend-friendly response.
    Supports both old text records and uploaded file records.
    """

    metadata = {}

    try:
        parsed = json.loads(record.content or "")

        if isinstance(parsed, dict):
            metadata = parsed

    except (json.JSONDecodeError, TypeError):
        metadata = {
            "description": record.content or ""
        }

    return {
        "id": record.id,
        "category": record.category,
        "title": record.title,
        "content": metadata.get(
            "description",
            record.content or ""
        ),
        "file_name": metadata.get("file_name"),
        "file_size": metadata.get("file_size"),
        "mime_type": metadata.get("mime_type"),
        "has_file": bool(metadata.get("stored_name")),
        "created_at": record.created_at.isoformat()
    }


def get_owned_record(
    record_id: int,
    user_id: int,
    db: Session
):
    """
    Retrieve a record only if it belongs to the current user.
    """

    record = db.scalar(
        select(Record).where(
            Record.id == record_id,
            Record.user_id == user_id
        )
    )

    if not record:
        raise HTTPException(
            status_code=404,
            detail="Health record not found."
        )

    return record


# ============================================================
# USER REGISTRATION
# ============================================================

@router.post("/auth/register")
def register_user(
    request: RegisterRequest,
    db: Session = Depends(get_db)
):
    existing_user = db.scalar(
        select(User).where(User.email == request.email)
    )

    if existing_user:
        raise HTTPException(
            status_code=409,
            detail="Email already registered."
        )

    if len(request.password) > 72:
        raise HTTPException(
            status_code=400,
            detail="Password must not exceed 72 bytes."
        )

    try:
        user = User(
            full_name=request.name,
            email=request.email,
            hashed_password=auth.hash_password(request.password)
        )

        db.add(user)
        db.commit()
        db.refresh(user)

        return {
            "success": True,
            "message": "Registration successful.",
            "user_id": user.id,
            "email": user.email
        }

    except Exception as e:
        db.rollback()
        print("Registration error:", str(e))

        raise HTTPException(
            status_code=500,
            detail="Unable to register user."
        )


# ============================================================
# USER LOGIN
# ============================================================

@router.post("/auth/login")
def login_user(
    form: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.scalar(
        select(User).where(User.email == form.username)
    )

    if not user or not auth.verify_password(
        form.password,
        user.hashed_password
    ):
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    access_token = auth.create_token(user.id)

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


# ============================================================
# CURRENT USER PROFILE
# ============================================================

@router.get("/auth/me")
def get_current_user(
    u: User = Depends(auth.current_user)
):
    return {
        "id": u.id,
        "full_name": u.full_name,
        "name": u.full_name,
        "email": u.email,
        "age": u.age,
        "sex": u.sex,
        "language": u.language,
        "consent": u.consent,
        "allergies": u.allergies,
        "emergency_contact": u.emergency_contact
    }


@router.put("/auth/profile")
def update_user_profile(
    request: ProfileUpdateRequest,
    u: User = Depends(auth.current_user),
    db: Session = Depends(get_db)
):
    try:
        updates = request.model_dump(exclude_unset=True)

        if "full_name" in updates and updates["full_name"] is not None:
            updates["full_name"] = updates["full_name"].strip()

            if len(updates["full_name"]) < 2:
                raise HTTPException(
                    status_code=400,
                    detail="Please enter a valid full name."
                )

        if "email" in updates and updates["email"] is not None:
            new_email = str(updates["email"]).strip().lower()

            existing_user = db.scalar(
                select(User).where(
                    User.email == new_email,
                    User.id != u.id
                )
            )

            if existing_user:
                raise HTTPException(
                    status_code=409,
                    detail="This email address is already registered."
                )

            updates["email"] = new_email

        if "sex" in updates and updates["sex"] is not None:
            if updates["sex"] not in [
                "Male",
                "Female",
                "Other",
                "Prefer not to say"
            ]:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid sex selection."
                )

        if "language" in updates and updates["language"] is not None:
            if updates["language"] not in ["en", "ml", "ta", "hi"]:
                raise HTTPException(
                    status_code=400,
                    detail="Unsupported language selection."
                )

        for field, value in updates.items():
            setattr(u, field, value)

        db.commit()
        db.refresh(u)

        return {
            "success": True,
            "message": "Profile updated successfully.",
            "user": {
                "id": u.id,
                "full_name": u.full_name,
                "email": u.email,
                "age": u.age,
                "sex": u.sex,
                "language": u.language,
                "consent": u.consent,
                "allergies": u.allergies,
                "emergency_contact": u.emergency_contact
            }
        }

    except HTTPException:
        raise

    except Exception as e:
        db.rollback()
        print("Profile update error:", str(e))

        raise HTTPException(
            status_code=500,
            detail="Unable to update profile."
        )


# ============================================================
# SYMPTOM ASSESSMENT
# ============================================================

@router.post("/symptoms/assess")
def assess_symptoms(
    request: SymptomAssessmentRequest,
    u: User = Depends(auth.current_user)
):
    try:
        if not request.symptoms.strip():
            raise HTTPException(
                status_code=400,
                detail="Please describe your symptoms."
            )

        if not request.sex.strip():
            raise HTTPException(
                status_code=400,
                detail="Please provide sex."
            )

        if not request.duration.strip():
            raise HTTPException(
                status_code=400,
                detail="Please provide symptom duration."
            )

        result = symptom.assess(
            symptoms=request.symptoms,
            age=request.age,
            sex=request.sex,
            duration=request.duration,
            severity=request.severity,
            lang=u.language
        )

        return {
            "success": True,
            "assessment": result,
            "disclaimer": DISCLAIMER.get(
                u.language,
                DISCLAIMER.get(
                    "en",
                    "This information is not a medical diagnosis."
                )
            )
        }

    except HTTPException:
        raise

    except Exception as e:
        print("Symptom assessment error:", str(e))

        raise HTTPException(
            status_code=500,
            detail="Unable to complete symptom assessment."
        )


# ============================================================
# AI CHAT ASSISTANT WITH EMERGENCY DETECTION
# ============================================================

@router.post("/chat")
def chat_with_medic_ai(
    request: ChatRequest,
    u: User = Depends(auth.current_user)
):
    try:
        message = request.message.strip()

        if not message:
            raise HTTPException(
                status_code=400,
                detail="Please enter a message."
            )

        # Emergency detection
        if safety.check_emergency(message):

            emergency_result = safety.create_emergency_response(
                message=message,
                language=u.language
            )

            return {
                "success": True,
                "answer": emergency_result["answer"],
                "sources": [],
                "grounded": False,
                "emergency": True,
                "disclaimer": emergency_result["disclaimer"]
            }

        # Validate conversation history
        conversation_history = []

        for item in request.history[-6:]:

            role = item.get("role")
            content = item.get("content")

            if role not in ("user", "assistant"):
                continue

            if not isinstance(content, str):
                continue

            content = content.strip()

            if not content:
                continue

            conversation_history.append({
                "role": role,
                "content": content[:5000]
            })

        profile = f"User language: {u.language}"

        # Generate RAG response
        result = rag.ask_llm(
            question=message,
            lang=u.language,
            profile=profile,
            history=conversation_history
        )

        if not isinstance(result, dict):
            raise HTTPException(
                status_code=503,
                detail="Invalid response from Medic.AI."
            )

        answer = result.get("answer", "")

        if not isinstance(answer, str) or not answer.strip():
            raise HTTPException(
                status_code=503,
                detail="Medic.AI could not generate a response."
            )

        sources = result.get("sources", [])
        grounded = result.get("grounded", False)

        return {
            "success": True,
            "answer": answer.strip(),
            "sources": sources,
            "grounded": grounded,
            "emergency": False,
            "disclaimer": DISCLAIMER.get(
                u.language,
                DISCLAIMER["en"]
            )
        }

    except HTTPException:
        raise

    except Exception as e:
        print("AI chat error:", str(e))

        raise HTTPException(
            status_code=500,
            detail=(
                "Medic.AI is temporarily unable to respond. "
                "Please try again."
            )
        )
    # ============================================================
# MEDICAL REPORT ANALYSIS
# ============================================================

@router.post("/reports/analyze")
async def analyze_report(
    file: UploadFile = File(...),
    report_type: str = Form("General"),
    u: User = Depends(auth.current_user),
    db: Session = Depends(get_db)
):
    temp_path = None

    try:
        # Validate the uploaded file and check its actual contents.
        data, ext = await read_validated_upload(file)

        # Save temporarily for text extraction.
        with tempfile.NamedTemporaryFile(
            suffix=ext,
            delete=False
        ) as temp_file:

            temp_file.write(data)
            temp_path = temp_file.name

        # Extract text from PDF or image.
        if ext == ".pdf":
            extracted_text = report.extract_pdf_text(temp_path)
        else:
            extracted_text = report.extract_text(temp_path)

        if not extracted_text or not extracted_text.strip():
            raise HTTPException(
                status_code=422,
                detail="Unable to extract readable text from the report."
            )

        # Analyze extracted medical information.
        findings = report.analyze(extracted_text)

        abnormal_findings = [
            finding
            for finding in findings
            if finding.get("status", "").lower() != "normal"
        ]

        summary = report.generate_summary(findings)

        # Generate an explanation when abnormal findings are detected.
        if abnormal_findings:

            prompt = f"""
You are Medic.AI, a healthcare information assistant.

Explain this medical report in simple language.

Report type:
{report_type}

Extracted report:
{extracted_text}

Detected findings:
{findings}

Abnormal findings:
{abnormal_findings}

Summary:
{summary}

Instructions:
1. Explain findings in simple language.
2. Do not diagnose diseases.
3. Do not prescribe medicines or dosages.
4. Never invent medical values.
5. Explain that laboratory reference ranges vary.
6. Recommend professional medical review for abnormal values.
7. Clearly distinguish information from diagnosis.
"""

            explanation_result = rag.ask_llm(
                prompt,
                u.language
            )

            if isinstance(explanation_result, dict):
                explanation = explanation_result.get(
                    "answer",
                    "AI explanation could not be generated."
                )
            else:
                explanation = str(explanation_result)

        else:

            explanation = (
                "No abnormal values were detected among the parameters "
                "recognized by Medic.AI. This does not guarantee that "
                "the entire report is normal. Please review the report "
                "with a qualified healthcare professional."
            )

        # Save the analysis as a health record.
        record = Record(
            user_id=u.id,
            category="report",
            title=file.filename or "Medical Report",
            content=extracted_text
        )

        db.add(record)
        db.commit()
        db.refresh(record)

        return {
            "success": True,
            "filename": file.filename,
            "report_type": report_type,
            "extracted_text": extracted_text,
            "findings": findings,
            "abnormal_findings": abnormal_findings,
            "summary": summary,
            "explanation": explanation,
            "record_id": record.id,
            "extraction_note": (
                "Automatically extracted values may contain errors. "
                "Verify them against the original report."
            ),
            "disclaimer": DISCLAIMER.get(
                u.language,
                DISCLAIMER.get(
                    "en",
                    "This is not a medical diagnosis."
                )
            )
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception as e:
        db.rollback()

        print("Medical report analysis error:", str(e))

        raise HTTPException(
            status_code=500,
            detail="An error occurred while analyzing the medical report."
        )

    finally:

        # Remove temporary file.
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except OSError as cleanup_error:
                print(
                    "Temporary file cleanup error:",
                    str(cleanup_error)
                )

        await file.close()


# ============================================================
# HEALTH RECORDS - ADD MANUAL RECORD
# ============================================================

@router.post("/records")
def add_health_record(
    request: HealthRecordRequest,
    u: User = Depends(auth.current_user),
    db: Session = Depends(get_db)
):
    try:
        record = Record(
            user_id=u.id,
            category=request.category.strip(),
            title=request.title.strip(),
            content=request.content.strip()
        )

        db.add(record)
        db.commit()
        db.refresh(record)

        return {
            "success": True,
            "message": "Health record added successfully.",
            "record": get_record_metadata(record)
        }

    except Exception as e:
        db.rollback()

        print("Health record creation error:", str(e))

        raise HTTPException(
            status_code=500,
            detail="Unable to create health record."
        )


# ============================================================
# HEALTH RECORDS - GET ALL RECORDS
# ============================================================

@router.get("/records")
def get_health_records(
    u: User = Depends(auth.current_user),
    db: Session = Depends(get_db)
):
    records = db.scalars(
        select(Record)
        .where(Record.user_id == u.id)
        .order_by(Record.created_at.desc())
    ).all()

    return {
        "success": True,
        "total": len(records),
        "records": [
            get_record_metadata(record)
            for record in records
        ]
    }


# ============================================================
# HEALTH RECORDS - UPLOAD DOCUMENT
# ============================================================

@router.post("/records/upload")
async def upload_health_record(
    file: UploadFile = File(...),
    category: str = Form(...),
    title: str = Form(...),
    description: str = Form(""),
    u: User = Depends(auth.current_user),
    db: Session = Depends(get_db)
):
    if not title.strip():
        raise HTTPException(
            status_code=400,
            detail="Record title is required."
        )

    if not category.strip():
        raise HTTPException(
            status_code=400,
            detail="Record category is required."
        )

    # Sanitize the original filename.
    original_filename = Path(
        file.filename or "medical_document"
    ).name

    file_path = None

    try:
        # Validate file type, size and signature.
        data, ext = await read_validated_upload(file)

        # Generate a unique server-side filename.
        stored_filename = f"{uuid.uuid4().hex}{ext}"
        file_path = UPLOAD_DIR / stored_filename

        # Save the uploaded document.
        with open(file_path, "wb") as uploaded_file:
            uploaded_file.write(data)

        metadata = {
            "description": description.strip(),
            "file_name": original_filename,
            "stored_name": stored_filename,
            "mime_type": file.content_type,
            "file_size": len(data)
        }

        record = Record(
            user_id=u.id,
            category=category.strip(),
            title=title.strip(),
            content=json.dumps(metadata)
        )

        db.add(record)
        db.commit()
        db.refresh(record)

        return {
            "success": True,
            "message": "Medical document uploaded successfully.",
            "record": get_record_metadata(record)
        }

    except HTTPException:
        db.rollback()

        if file_path and file_path.exists():
            file_path.unlink()

        raise

    except Exception as e:
        db.rollback()

        if file_path and file_path.exists():
            file_path.unlink()

        print("Health document upload error:", str(e))

        raise HTTPException(
            status_code=500,
            detail="Unable to upload medical document."
        )

    finally:
        await file.close()


# ============================================================
# HEALTH RECORDS - DOWNLOAD / VIEW DOCUMENT
# ============================================================

@router.get("/records/{record_id}/file")
def download_health_record(
    record_id: int,
    u: User = Depends(auth.current_user),
    db: Session = Depends(get_db)
):
    # Ensure the record belongs to the logged-in user.
    record = get_owned_record(
        record_id,
        u.id,
        db
    )

    try:
        metadata = json.loads(record.content or "{}")
    except (json.JSONDecodeError, TypeError):
        metadata = {}

    stored_filename = metadata.get("stored_name")

    if not stored_filename:
        raise HTTPException(
            status_code=404,
            detail="This record does not have an uploaded document."
        )

    # Prevent path traversal.
    if Path(stored_filename).name != stored_filename:
        raise HTTPException(
            status_code=400,
            detail="Invalid document reference."
        )

    file_path = UPLOAD_DIR / stored_filename

    if not file_path.is_file():
        raise HTTPException(
            status_code=404,
            detail="Uploaded document not found."
        )

    original_filename = metadata.get(
        "file_name",
        record.title
    )

    mime_type = metadata.get(
        "mime_type",
        "application/octet-stream"
    )

    return FileResponse(
        path=str(file_path),
        media_type=mime_type,
        filename=original_filename,
        content_disposition_type="inline"
    )


# ============================================================
# HEALTH RECORDS - DELETE RECORD
# ============================================================

@router.delete("/records/{record_id}")
def delete_health_record(
    record_id: int,
    u: User = Depends(auth.current_user),
    db: Session = Depends(get_db)
):
    record = get_owned_record(
        record_id,
        u.id,
        db
    )

    file_path = None

    try:
        metadata = json.loads(record.content or "{}")

        stored_filename = metadata.get("stored_name")

        if stored_filename:
            # Only allow a simple stored filename.
            if Path(stored_filename).name == stored_filename:
                file_path = UPLOAD_DIR / stored_filename

        db.delete(record)
        db.commit()

        # Remove the physical file after successful DB deletion.
        if file_path and file_path.is_file():
            try:
                file_path.unlink()
            except OSError as cleanup_error:
                print(
                    "Uploaded file cleanup error:",
                    str(cleanup_error)
                )

        return {
            "success": True,
            "message": "Health record deleted successfully."
        }

    except Exception as e:
        db.rollback()

        print("Health record deletion error:", str(e))

        raise HTTPException(
            status_code=500,
            detail="Unable to delete health record."
        )
    # ============================================================
# VITALS MONITOR
# ============================================================

@router.post("/vitals")
def save_vitals(
    request: VitalsRequest,
    u: User = Depends(auth.current_user),
    db: Session = Depends(get_db)
):
    try:
        readings = [
            Vital(
                user_id=u.id,
                kind="heart_rate",
                value=request.heartRate
            ),
            Vital(
                user_id=u.id,
                kind="bp",
                value=request.systolic,
                value2=request.diastolic
            ),
            Vital(
                user_id=u.id,
                kind="spo2",
                value=request.oxygen
            ),
            Vital(
                user_id=u.id,
                kind="temp",
                value=request.temperature
            )
        ]

        db.add_all(readings)
        db.commit()

        return {
            "success": True,
            "message": "Vital measurements saved successfully."
        }

    except Exception as e:
        db.rollback()
        print("Vitals save error:", str(e))

        raise HTTPException(
            status_code=500,
            detail="Unable to save vital measurements."
        )


@router.get("/vitals")
def get_vitals(
    u: User = Depends(auth.current_user),
    db: Session = Depends(get_db)
):
    readings = db.scalars(
        select(Vital)
        .where(Vital.user_id == u.id)
        .order_by(Vital.created_at.desc())
    ).all()

    return {
        "success": True,
        "readings": [
            {
                "id": item.id,
                "kind": item.kind,
                "value": item.value,
                "value2": item.value2,
                "created_at": item.created_at.isoformat()
            }
            for item in readings
        ]
    }


# ============================================================
# MEDICATION MANAGEMENT - ADD
# ============================================================

@router.post("/medications")
def add_medication(
    request: MedicationRequest,
    u: User = Depends(auth.current_user),
    db: Session = Depends(get_db)
):
    if request.end_date and request.end_date < request.start_date:
        raise HTTPException(
            status_code=400,
            detail="End date cannot be earlier than start date."
        )

    if not all(t.strip() for t in request.times):
        raise HTTPException(
            status_code=400,
            detail="Medication times cannot be empty."
        )

    try:
        medication = Medication(
            user_id=u.id,
            medicine=request.medicine.strip(),
            dosage=request.dosage.strip(),
            frequency=request.frequency.strip(),
            times=",".join(t.strip() for t in request.times),
            instructions=request.instructions.strip(),
            start_date=request.start_date.isoformat(),
            end_date=(
                request.end_date.isoformat()
                if request.end_date
                else None
            ),
            status="active"
        )

        db.add(medication)
        db.commit()
        db.refresh(medication)

        return {
            "success": True,
            "message": "Medication added successfully.",
            "medication_id": medication.id
        }

    except Exception as e:
        db.rollback()
        print("Medication error:", str(e))

        raise HTTPException(
            status_code=500,
            detail="Unable to add medication."
        )


# ============================================================
# MEDICATION MANAGEMENT - GET ALL
# ============================================================

@router.get("/medications")
def get_medications(
    u: User = Depends(auth.current_user),
    db: Session = Depends(get_db)
):
    medications = db.scalars(
        select(Medication)
        .where(Medication.user_id == u.id)
        .order_by(Medication.created_at.desc())
    ).all()

    return {
        "success": True,
        "medications": [
            {
                "id": item.id,
                "medicine": item.medicine,
                "dosage": item.dosage,
                "frequency": item.frequency,
                "times": (
                    item.times.split(",")
                    if item.times else []
                ),
                "instructions": item.instructions,
                "start_date": item.start_date,
                "end_date": item.end_date,
                "status": item.status,
                "created_at": item.created_at.isoformat()
            }
            for item in medications
        ]
    }


# ============================================================
# MEDICATION MANAGEMENT - UPDATE
# ============================================================

@router.put("/medications/{medication_id}")
def update_medication(
    medication_id: int,
    request: MedicationRequest,
    u: User = Depends(auth.current_user),
    db: Session = Depends(get_db)
):
    medication = db.scalar(
        select(Medication).where(
            Medication.id == medication_id,
            Medication.user_id == u.id
        )
    )

    if not medication:
        raise HTTPException(
            status_code=404,
            detail="Medication not found."
        )

    if request.end_date and request.end_date < request.start_date:
        raise HTTPException(
            status_code=400,
            detail="End date cannot be earlier than start date."
        )

    if not all(t.strip() for t in request.times):
        raise HTTPException(
            status_code=400,
            detail="Medication times cannot be empty."
        )

    try:
        medication.medicine = request.medicine.strip()
        medication.dosage = request.dosage.strip()
        medication.frequency = request.frequency.strip()

        medication.times = ",".join(
            t.strip() for t in request.times
        )

        medication.instructions = request.instructions.strip()
        medication.start_date = request.start_date.isoformat()

        medication.end_date = (
            request.end_date.isoformat()
            if request.end_date
            else None
        )

        db.commit()

        return {
            "success": True,
            "message": "Medication updated successfully."
        }

    except Exception as e:
        db.rollback()
        print("Medication update error:", str(e))

        raise HTTPException(
            status_code=500,
            detail="Unable to update medication."
        )


# ============================================================
# MEDICATION MANAGEMENT - DELETE
# ============================================================

@router.delete("/medications/{medication_id}")
def delete_medication(
    medication_id: int,
    u: User = Depends(auth.current_user),
    db: Session = Depends(get_db)
):
    medication = db.scalar(
        select(Medication).where(
            Medication.id == medication_id,
            Medication.user_id == u.id
        )
    )

    if not medication:
        raise HTTPException(
            status_code=404,
            detail="Medication not found."
        )

    try:
        db.delete(medication)
        db.commit()

        return {
            "success": True,
            "message": "Medication deleted successfully."
        }

    except Exception as e:
        db.rollback()
        print("Medication deletion error:", str(e))

        raise HTTPException(
            status_code=500,
            detail="Unable to delete medication."
        )


# ============================================================
# CHANGE PASSWORD
# ============================================================

@router.put("/auth/change-password")
def change_password(
    request: ChangePasswordRequest,
    u: User = Depends(auth.current_user),
    db: Session = Depends(get_db)
):
    # Verify current password.
    if not auth.verify_password(
        request.current_password,
        u.hashed_password
    ):
        raise HTTPException(
            status_code=400,
            detail="Current password is incorrect."
        )

    # Prevent reusing the same password.
    if request.current_password == request.new_password:
        raise HTTPException(
            status_code=400,
            detail="New password must be different from the current password."
        )

    try:
        u.hashed_password = auth.hash_password(
            request.new_password
        )

        db.commit()

        return {
            "success": True,
            "message": "Password changed successfully."
        }

    except Exception as e:
        db.rollback()
        print("Password change error:", str(e))

        raise HTTPException(
            status_code=500,
            detail="Unable to change password."
        )