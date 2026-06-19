import os
from fastapi import FastAPI, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
from database import engine, get_db
from models import (
    Base,
    User,
    Incident,
    ActivityLog,
    Evidence
)
from schemas import (
    UserRegister,
    UserLogin,
    IncidentCreate,
    IncidentUpdate,
    UserUpdate
)
from auth import (
    hash_password,
    verify_password,
    create_access_token
)

Base.metadata.create_all(bind=engine)
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.get("/")
def home():
    return {
        "message": "Cybersecurity Incident Tracker API"
    }


@app.post("/register")
def register_user(
    user: UserRegister,
    db: Session = Depends(get_db)
):
    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_user:
        return {
            "detail": "Email already registered"
        }

    hashed_password = hash_password(user.password)

    new_user = User(
        full_name=user.full_name,
        email=user.email,
        password_hash=hashed_password,
        role=user.role
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User registered successfully"
    }

@app.post("/login")
def login_user(
    user: UserLogin,
    db: Session = Depends(get_db)
):
    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if not existing_user:
        return {
            "detail": "Invalid email or password"
        }

    if not verify_password(
        user.password,
        existing_user.password_hash
    ):
        return {
            "detail": "Invalid email or password"
        }

    access_token = create_access_token(
    data={
        "sub": existing_user.email,
        "user_id": existing_user.user_id,
        "full_name": existing_user.full_name,
        "role": existing_user.role
    }
)

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@app.post("/incidents")
def create_incident(
    incident: IncidentCreate,
    db: Session = Depends(get_db)
):
    new_incident = Incident(
        title=incident.title,
        category=incident.category,
        severity=incident.severity,
        description=incident.description,

        status="Open",

        reported_by=1
    )

    db.add(new_incident)
    db.commit()
    db.refresh(new_incident)
    log = ActivityLog(
    incident_id=new_incident.incident_id,
    action="Incident created",
    performed_by=new_incident.reported_by
)

    db.add(log)
    db.commit()

    return {
        "incident_id": new_incident.incident_id,
        "title": new_incident.title,
        "category": new_incident.category,
        "severity": new_incident.severity,
        "status": new_incident.status,
        "description": new_incident.description,
        "reported_by": new_incident.reported_by,
        "created_at": new_incident.created_at,
        "updated_at": new_incident.updated_at
    }
@app.get("/incidents")
def get_incidents(
    db: Session = Depends(get_db)
):
    incidents = db.query(Incident).all()

    return incidents
@app.get("/incidents/search")
def search_incidents(
    q: str,
    db: Session = Depends(get_db)
):
    incidents = db.query(Incident).filter(
        (Incident.title.ilike(f"%{q}%")) |
        (Incident.category.ilike(f"%{q}%"))
    ).all()
    return incidents


@app.get("/incidents/filter")
def filter_incidents(
    status: str = None,
    severity: str = None,
    category: str = None,
    db: Session = Depends(get_db)
):
    query = db.query(Incident)

    if status:
        query = query.filter(Incident.status == status)

    if severity:
        query = query.filter(Incident.severity == severity)

    if category:
        query = query.filter(Incident.category == category)

    return query.all()

@app.get("/incidents/{incident_id}")
def get_incident(
    incident_id: int,
    db: Session = Depends(get_db)
):
    incident = db.query(Incident).filter(
        Incident.incident_id == incident_id
    ).first()

    if not incident:
        return {
            "detail": "Incident not found"
        }

    return incident
@app.put("/incidents/{incident_id}")
def update_incident(
    incident_id: int,
    incident_update: IncidentUpdate,
    db: Session = Depends(get_db)
):
    db_incident = db.query(Incident).filter(
        Incident.incident_id == incident_id
    ).first()

    if not db_incident:
        return {
            "detail": "Incident not found"
        }

    allowed_transitions = {
        "Open": ["In-Progress"],
        "In-Progress": ["Resolved"],
        "Resolved": []
    }

    # Update normal fields
    if incident_update.title is not None:
        db_incident.title = incident_update.title

    if incident_update.description is not None:
        db_incident.description = incident_update.description

    if incident_update.category is not None:
        db_incident.category = incident_update.category

    if incident_update.severity is not None:
        db_incident.severity = incident_update.severity

    # Handle status update separately
    if incident_update.status is not None:
        current_status = db_incident.status
        new_status = incident_update.status

        if new_status != current_status:
            if new_status not in allowed_transitions[current_status]:
                return {
                    "detail": f"Invalid status transition: {current_status} → {new_status}"
                }

            db_incident.status = new_status

            log = ActivityLog(
                incident_id=db_incident.incident_id,
                action=f"Status changed to {new_status}",
                performed_by=db_incident.reported_by
            )

            db.add(log)

    db.commit()
    db.refresh(db_incident)

    return {
        "incident_id": db_incident.incident_id,
        "title": db_incident.title,
        "category": db_incident.category,
        "severity": db_incident.severity,
        "status": db_incident.status,
        "description": db_incident.description,
        "reported_by": db_incident.reported_by,
        "created_at": db_incident.created_at,
        "updated_at": db_incident.updated_at
    }
@app.get("/dashboard/stats")
def dashboard_stats(
    db: Session = Depends(get_db)
):
    total = db.query(Incident).count()

    open_count = db.query(Incident).filter(
        Incident.status == "Open"
    ).count()

    in_progress_count = db.query(Incident).filter(
        Incident.status == "In-Progress"
    ).count()

    resolved_count = db.query(Incident).filter(
        Incident.status == "Resolved"
    ).count()

    return {
        "total": total,
        "open": open_count,
        "in_progress": in_progress_count,
        "resolved": resolved_count
    }
@app.delete("/incidents/{incident_id}")
def delete_incident(
    incident_id: int,
    db: Session = Depends(get_db)
):
    db_incident = db.query(Incident).filter(
        Incident.incident_id == incident_id
    ).first()

    if not db_incident:
        return {
            "detail": "Incident not found"
        }

    db.delete(db_incident)
    db.commit()

    return {
        "message": "Incident deleted successfully"
    }
@app.get("/incidents/{incident_id}/logs")
def get_incident_logs(
    incident_id: int,
    db: Session = Depends(get_db)
):
    logs = db.query(ActivityLog).filter(
        ActivityLog.incident_id == incident_id
    ).all()

    return logs
@app.get("/users")
def get_users(
    db: Session = Depends(get_db)
):
    return db.query(User).all()
@app.get("/users/{user_id}")
def get_user(
    user_id: int,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.user_id == user_id
    ).first()

    if not user:
        return {
            "detail": "User not found"
        }

    return user
@app.put("/users/{user_id}")
def update_user(
    user_id: int,
    user_update: UserUpdate,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.user_id == user_id
    ).first()

    if not user:
        return {
            "detail": "User not found"
        }

    if user_update.full_name is not None:
        user.full_name = user_update.full_name

    if user_update.password is not None:
        user.password_hash = hash_password(
            user_update.password
        )

    db.commit()
    db.refresh(user)

    return {
        "message": "Profile updated successfully"
    }
@app.get("/incidents/{incident_id}/evidence")
def get_incident_evidence(
    incident_id: int,
    db: Session = Depends(get_db)
):
    evidence = db.query(Evidence).filter(
        Evidence.incident_id == incident_id
    ).all()

    return evidence
@app.post("/evidence/upload")
async def upload_evidence(
    incident_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    os.makedirs("uploads", exist_ok=True)

    file_path = f"uploads/{file.filename}"

    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())

    evidence = Evidence(
        incident_id=incident_id,
        file_name=file.filename,
        file_path=file_path
    )

    db.add(evidence)
    db.commit()
    db.refresh(evidence)

    return {
        "message": "Evidence uploaded successfully",
        "evidence_id": evidence.evidence_id,
        "file_name": evidence.file_name
    }