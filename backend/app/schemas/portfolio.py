from pydantic import BaseModel, Field
from decimal import Decimal
from datetime import datetime
from uuid import UUID
from typing import Optional


class PortfolioBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    risk_percentage: Decimal = Field(default=Decimal("0.5"), ge=Decimal("0.1"), le=Decimal("10.0"))


class PortfolioCreate(PortfolioBase):
    initial_balance: Decimal = Field(..., gt=0)


class PortfolioUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    risk_percentage: Optional[Decimal] = Field(None, ge=Decimal("0.1"), le=Decimal("10.0"))


class PortfolioResponse(PortfolioBase):
    id: UUID
    user_id: UUID
    balance: Decimal
    initial_balance: Decimal
    created_at: datetime
    updated_at: Optional[datetime]
    
    # Calculated fields
    current_risk_amount: Decimal
    total_pnl: Decimal
    total_pnl_percentage: Decimal

    class Config:
        from_attributes = True


class PortfolioStatistics(BaseModel):
    total_trades: int
    winning_trades: int
    losing_trades: int
    win_rate: Decimal
    total_profit: Decimal
    total_loss: Decimal
    largest_win: Decimal
    largest_loss: Decimal
    average_win: Decimal
    average_loss: Decimal 