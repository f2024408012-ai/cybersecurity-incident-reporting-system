from pydantic import BaseModel, EmailStr
from typing import Optional

class UserRegister(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: str = "user"


class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    password: Optional[str] = None

class IncidentCreate(BaseModel):
    title: str
    category: str
    severity: str
    description: str

class IncidentUpdate(BaseModel):
    title: str | None = None
    category: str | None = None
    severity: str | None = None
    status: str | None = None
    description: str | None = None
