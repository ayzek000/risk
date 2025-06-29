from sqlalchemy import Column, String, DateTime, ForeignKey, DECIMAL, Date, Text, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base
import uuid
import enum


class TradeDirection(enum.Enum):
    BUY = "buy"
    SELL = "sell"


class Trade(Base):
    __tablename__ = "trades"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    portfolio_id = Column(UUID(as_uuid=True), ForeignKey("portfolios.id"), nullable=False)
    
    # Trade details
    trade_date = Column(Date, default=func.current_date())
    instrument = Column(String)  # XAUUSD, EURUSD, etc.
    timeframe = Column(String)   # M15, H1, D1, etc.
    
    # Risk and lot calculation
    risk_amount = Column(DECIMAL(10, 2), nullable=False)
    stop_loss_points = Column(DECIMAL(10, 2), nullable=False)
    lot_size = Column(DECIMAL(10, 4), nullable=False)
    
    # Additional trade info
    account_type = Column(String)  # Demo, Real, etc.
    direction = Column(Enum(TradeDirection))
    
    # Result (can be null initially)
    result = Column(DECIMAL(10, 2))  # Profit/Loss in dollars
    
    # Notes
    notes = Column(Text)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    portfolio = relationship("Portfolio", back_populates="trades")

    @property
    def is_profitable(self):
        """Check if trade is profitable"""
        return self.result and self.result > 0

    @property
    def risk_reward_ratio(self):
        """Calculate risk/reward ratio"""
        if not self.result or self.risk_amount == 0:
            return None
        return abs(self.result) / self.risk_amount 