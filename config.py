import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Secret key for session security — set this in .env for production
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key-change-in-production")
    
    # Database connection — defaults to local PostgreSQL
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL",
        "postgresql://postgres:password@localhost:5432/task_manager_db"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False