from datetime import datetime, timedelta
import bcrypt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from .config import settings
from .database import get_db
from .models import User

bearer = HTTPBearer()


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode(), password_hash.encode())


def create_token(user_id: int) -> str:
    exp = datetime.utcnow() + timedelta(hours=12)
    return jwt.encode({"sub": str(user_id), "exp": exp}, settings.jwt_secret, algorithm="HS256")


def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    try:
        data = jwt.decode(creds.credentials, settings.jwt_secret, algorithms=["HS256"])
        user = db.get(User, int(data["sub"]))
    except (JWTError, KeyError, ValueError):
        raise HTTPException(status_code=401, detail="Token inválido")
    if not user:
        raise HTTPException(status_code=401, detail="Usuario no existe")
    return user


def can_modify(user: User, owner_id: int) -> bool:
    return user.id == owner_id or user.role == "master"