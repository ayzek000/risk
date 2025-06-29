from pydantic import BaseModel, Field
from decimal import Decimal
from datetime import datetime, date
from uuid import UUID
from typing import Optional
from ..models.trade import TradeDirection


class TradeBase(BaseModel):
    trade_date: Optional[date] = None
    instrument: Optional[str] = Field(None, max_length=20)
    timeframe: Optional[str] = Field(None, max_length=10)
    stop_loss_points: Decimal = Field(..., gt=0)
    account_type: Optional[str] = Field(None, max_length=50)
    direction: Optional[TradeDirection] = None
    notes: Optional[str] = Field(None, max_length=1000)


class TradeCreate(TradeBase):
    pass  # stop_loss_points is required, others are optional


class TradeUpdate(BaseModel):
    trade_date: Optional[date] = None
    instrument: Optional[str] = Field(None, max_length=20)
    timeframe: Optional[str] = Field(None, max_length=10)
    stop_loss_points: Optional[Decimal] = Field(None, gt=0)
    account_type: Optional[str] = Field(None, max_length=50)
    direction: Optional[TradeDirection] = None
    result: Optional[Decimal] = None
    notes: Optional[str] = Field(None, max_length=1000)


class TradeResponse(TradeBase):
    id: UUID
    portfolio_id: UUID
    risk_amount: Decimal
    lot_size: Decimal
    result: Optional[Decimal]
    created_at: datetime
    updated_at: Optional[datetime]
    
    # Calculated fields
    is_profitable: Optional[bool]
    risk_reward_ratio: Optional[Decimal]

    class Config:
        from_attributes = True


class TradeResultUpdate(BaseModel):
    result: Decimal = Field(..., description="Profit/Loss in dollars") 