from sqlalchemy import Column, String, DateTime, ForeignKey, DECIMAL
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base
import uuid


class Portfolio(Base):
    __tablename__ = "portfolios"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    balance = Column(DECIMAL(15, 2), nullable=False)
    initial_balance = Column(DECIMAL(15, 2), nullable=False)
    risk_percentage = Column(DECIMAL(5, 2), default=0.50)  # Default 0.5%
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    owner = relationship("User", back_populates="portfolios")
    trades = relationship("Trade", back_populates="portfolio", cascade="all, delete-orphan")

    @property
    def current_risk_amount(self):
        """Calculate current risk amount based on balance and risk percentage"""
        return (self.balance * self.risk_percentage) / 100

    @property
    def total_pnl(self):
        """Calculate total P&L (current balance - initial balance)"""
        return self.balance - self.initial_balance

    @property
    def total_pnl_percentage(self):
        """Calculate total P&L as percentage"""
        if self.initial_balance == 0:
            return 0
        return ((self.balance - self.initial_balance) / self.initial_balance) * 100 