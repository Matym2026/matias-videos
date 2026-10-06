from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session
from typing import Optional
from .. import models, schemas
from ..auth import get_current_user, can_modify
from ..config import settings
from ..database import get_db
from ..storage import upload_file, delete_file

router = APIRouter(tags=["videos"])


def video_out(v: models.Video) -> schemas.VideoOut:
    return schemas.VideoOut(
        id=v.id, title=v.title, description=v.description or "",
        video_url=v.video_url, thumbnail_url=v.thumbnail_url,
        views=v.views, user_id=v.user_id, user_name=v.owner.name,
        created_at=v.created_at,
    )


def find_video(db: Session, video_id: int) -> models.Video:
    video = db.get(models.Video, video_id)
    if not video:
        raise HTTPException(404, "Video no encontrado")
    return video


@router.post("/videos", response_model=schemas.VideoOut, status_code=201)
def create_video(
    title: str = Form(...),
    description: str = Form(""),
    video: UploadFile = File(...),
    thumbnail: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    video_url = upload_file(video, settings.s3_videos_bucket, ["mp4"], max_mb=100)
    thumb_url = upload_file(thumbnail, settings.s3_thumbs_bucket, ["jpg", "jpeg", "png"], max_mb=5)
    new = models.Video(title=title, description=description,
                       video_url=video_url, thumbnail_url=thumb_url, user_id=user.id)
    db.add(new)
    db.commit()
    db.refresh(new)
    return video_out(new)


@router.get("/videos", response_model=list[schemas.VideoOut])
def list_videos(user_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(models.Video)
    if user_id:
        query = query.filter(models.Video.user_id == user_id)
    return [video_out(v) for v in query.order_by(models.Video.created_at.desc()).all()]


@router.get("/videos/{video_id}", response_model=schemas.VideoOut)
def get_video(video_id: int, db: Session = Depends(get_db)):
    video = find_video(db, video_id)
    video.views += 1
    db.commit()
    return video_out(video)


@router.get("/videos/{video_id}/related", response_model=list[schemas.VideoOut])
def related_videos(video_id: int, db: Session = Depends(get_db)):
    others = (db.query(models.Video)
              .filter(models.Video.id != video_id)
              .order_by(models.Video.views.desc()).limit(8).all())
    return [video_out(v) for v in others]


@router.put("/videos/{video_id}", response_model=schemas.VideoOut)
def update_video(video_id: int, data: schemas.VideoUpdate,
                 db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    video = find_video(db, video_id)
    if not can_modify(user, video.user_id):
        raise HTTPException(403, "No puedes editar este video")
    if data.title is not None:
        video.title = data.title
    if data.description is not None:
        video.description = data.description
    db.commit()
    return video_out(video)


@router.delete("/videos/{video_id}", status_code=204)
def delete_video(video_id: int, db: Session = Depends(get_db),
                 user: models.User = Depends(get_current_user)):
    video = find_video(db, video_id)
    if not can_modify(user, video.user_id):
        raise HTTPException(403, "No puedes eliminar este video")
    delete_file(video.video_url, settings.s3_videos_bucket)
    delete_file(video.thumbnail_url, settings.s3_thumbs_bucket)
    db.delete(video)
    db.commit()


@router.post("/videos/{video_id}/comments", response_model=schemas.CommentOut, status_code=201)
def add_comment(video_id: int, data: schemas.CommentCreate,
                db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    find_video(db, video_id)
    comment = models.Comment(content=data.content, user_id=user.id, video_id=video_id)
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return schemas.CommentOut(id=comment.id, content=comment.content, user_id=user.id,
                              user_name=user.name, video_id=video_id, created_at=comment.created_at)


@router.get("/videos/{video_id}/comments", response_model=list[schemas.CommentOut])
def list_comments(video_id: int, db: Session = Depends(get_db)):
    find_video(db, video_id)
    comments = (db.query(models.Comment).filter(models.Comment.video_id == video_id)
                .order_by(models.Comment.created_at.desc()).all())
    return [schemas.CommentOut(id=c.id, content=c.content, user_id=c.user_id,
                               user_name=c.author.name, video_id=c.video_id,
                               created_at=c.created_at) for c in comments]