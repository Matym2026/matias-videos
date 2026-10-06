from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import Base, engine
from .routers import users, videos

Base.metadata.create_all(bind=engine)  # crea las tablas si no existen

app = FastAPI(title="Matías Videos API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(videos.router)