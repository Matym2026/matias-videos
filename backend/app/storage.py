import uuid
import boto3
from fastapi import HTTPException, UploadFile
from .config import settings

s3 = boto3.client("s3", region_name=settings.aws_region)

MAX_VIDEO_MB = 100


def upload_file(file: UploadFile, bucket: str, allowed: list[str], max_mb: int = 10) -> str:
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in allowed:
        raise HTTPException(400, f"Formato no permitido. Usa: {', '.join(allowed)}")

    file.file.seek(0, 2)
    size = file.file.tell()
    file.file.seek(0)
    if size > max_mb * 1024 * 1024:
        raise HTTPException(400, f"El archivo supera {max_mb} MB")

    key = f"{uuid.uuid4().hex}.{ext}"
    s3.upload_fileobj(file.file, bucket, key, ExtraArgs={"ContentType": file.content_type})
    return f"https://{bucket}.s3.{settings.aws_region}.amazonaws.com/{key}"


def delete_file(url: str, bucket: str):
    key = url.split(".amazonaws.com/")[-1]
    s3.delete_object(Bucket=bucket, Key=key)