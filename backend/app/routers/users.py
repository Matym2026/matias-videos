from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas
from ..auth import hash_password, verify_password, create_token
from ..database import get_db

router = APIRouter(tags=["usuarios"])


def user_out(u: models.User) -> schemas.UserOut:
    return schemas.UserOut(id=u.id, name=u.name, email=u.email, role=u.role, video_count=len(u.videos))


@router.post("/users", response_model=schemas.UserOut, status_code=201)
def register(data: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == data.email).first():
        raise HTTPException(400, "Ese correo ya está registrado")
    user = models.User(name=data.name, email=data.email, password_hash=hash_password(data.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return user_out(user)


@router.post("/login", response_model=schemas.TokenOut)
def login(data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(401, "Correo o contraseña incorrectos")
    return schemas.TokenOut(access_token=create_token(user.id), user=user_out(user))


@router.get("/users/{user_id}", response_model=schemas.UserOut)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.get(models.User, user_id)
    if not user:
        raise HTTPException(404, "Usuario no encontrado")
    return user_out(user)