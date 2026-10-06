from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    video_count: int = 0


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class VideoOut(BaseModel):
    id: int
    title: str
    description: str
    video_url: str
    thumbnail_url: str
    views: int
    user_id: int
    user_name: str
    created_at: datetime


class VideoUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None


class CommentCreate(BaseModel):
    content: str


class CommentOut(BaseModel):
    id: int
    content: str
    user_id: int
    user_name: str
    video_id: int
    created_at: datetime