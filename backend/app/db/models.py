"""
SQLAlchemy ORM Data Models for TamilScript AI.
Tables:
- User: registered users, authentication, XP, streaks
- DrawingHistory: real-time drawn inputs, predictions, latency
- PracticeSession: Handwriting coach scores, character target, loop/proportions feedback
- LeaderboardEntry: gamified rank and badges
- UserFeedback: feedback on prediction quality
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from .session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    xp = Column(Integer, default=0)
    streak_days = Column(Integer, default=1)
    last_active = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    drawings = relationship("DrawingHistory", back_populates="user", cascade="all, delete-orphan")
    practice_sessions = relationship("PracticeSession", back_populates="user", cascade="all, delete-orphan")

class DrawingHistory(Base):
    __tablename__ = "drawings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    predicted_char = Column(String(10), nullable=False)
    transliteration = Column(String(50), nullable=False)
    confidence = Column(Float, nullable=False)
    latency_ms = Column(Float, nullable=False)
    input_type = Column(String(20), default="strokes") # "strokes" or "image"
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="drawings")

class PracticeSession(Base):
    __tablename__ = "practice_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    target_char = Column(String(10), nullable=False)
    quality_score = Column(Float, nullable=False)
    proportions_score = Column(Float, default=85.0)
    loops_score = Column(Float, default=85.0)
    smoothness_score = Column(Float, default=85.0)
    feedback_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="practice_sessions")

class LeaderboardEntry(Base):
    __tablename__ = "leaderboard"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    total_xp = Column(Integer, default=0)
    streak_days = Column(Integer, default=1)
    rank = Column(Integer, default=1)
    badge = Column(String(50), default="Script Novice")
    updated_at = Column(DateTime, default=datetime.utcnow)
