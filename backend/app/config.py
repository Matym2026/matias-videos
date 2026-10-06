from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    jwt_secret: str
    aws_region: str = "us-east-1"
    s3_videos_bucket: str
    s3_thumbs_bucket: str
    cors_origins: str = "*"

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()