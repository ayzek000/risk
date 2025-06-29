from decimal import Decimal
from typing import Tuple


class TradingCalculator:
    """Сервис для торговых вычислений"""
    
    @staticmethod
    def calculate_risk_amount(balance: Decimal, risk_percentage: Decimal) -> Decimal:
        """
        Вычисляет сумму риска в долларах
        
        Args:
            balance: Текущий баланс портфеля
            risk_percentage: Процент риска (например, 0.5 для 0.5%)
            
        Returns:
            Сумма риска в долларах
        """
        if balance <= 0 or risk_percentage <= 0:
            return Decimal("0")
        
        return (balance * risk_percentage) / 100
    
    @staticmethod
    def calculate_lot_size(risk_amount: Decimal, stop_loss_points: Decimal) -> Decimal:
        """
        Вычисляет размер лота
        
        Формула: Лот = Риск ÷ Стоп-лосс ÷ 10
        
        Args:
            risk_amount: Сумма риска в долларах
            stop_loss_points: Стоп-лосс в пунктах
            
        Returns:
            Размер лота
        """
        if risk_amount <= 0 or stop_loss_points <= 0:
            return Decimal("0")
        
        return risk_amount / stop_loss_points / 10
    
    @staticmethod
    def calculate_trade_data(
        balance: Decimal, 
        risk_percentage: Decimal, 
        stop_loss_points: Decimal
    ) -> Tuple[Decimal, Decimal]:
        """
        Вычисляет данные для сделки
        
        Args:
            balance: Текущий баланс
            risk_percentage: Процент риска
            stop_loss_points: Стоп-лосс в пунктах
            
        Returns:
            Tuple[risk_amount, lot_size]
        """
        risk_amount = TradingCalculator.calculate_risk_amount(balance, risk_percentage)
        lot_size = TradingCalculator.calculate_lot_size(risk_amount, stop_loss_points)
        
        return risk_amount, lot_size
    
    @staticmethod
    def calculate_new_balance(current_balance: Decimal, trade_result: Decimal) -> Decimal:
        """
        Вычисляет новый баланс после сделки
        
        Args:
            current_balance: Текущий баланс
            trade_result: Результат сделки (прибыль/убыток)
            
        Returns:
            Новый баланс
        """
        return current_balance + trade_result
    
    @staticmethod
    def calculate_portfolio_statistics(trades_data: list) -> dict:
        """
        Вычисляет статистику портфеля
        
        Args:
            trades_data: Список данных сделок с полем result
            
        Returns:
            Словарь со статистикой
        """
        if not trades_data:
            return {
                "total_trades": 0,
                "winning_trades": 0,
                "losing_trades": 0,
                "win_rate": Decimal("0"),
                "total_profit": Decimal("0"),
                "total_loss": Decimal("0"),
                "net_pnl": Decimal("0"),
                "largest_win": Decimal("0"),
                "largest_loss": Decimal("0"),
                "average_win": Decimal("0"),
                "average_loss": Decimal("0")
            }
        
        # Фильтруем только сделки с результатами
        completed_trades = [trade for trade in trades_data if trade.result is not None]
        
        if not completed_trades:
            return {
                "total_trades": len(trades_data),
                "winning_trades": 0,
                "losing_trades": 0,
                "win_rate": Decimal("0"),
                "total_profit": Decimal("0"),
                "total_loss": Decimal("0"),
                "net_pnl": Decimal("0"),
                "largest_win": Decimal("0"),
                "largest_loss": Decimal("0"),
                "average_win": Decimal("0"),
                "average_loss": Decimal("0")
            }
        
        winning_trades = [trade for trade in completed_trades if trade.result > 0]
        losing_trades = [trade for trade in completed_trades if trade.result < 0]
        
        total_profit = sum(trade.result for trade in winning_trades)
        total_loss = sum(trade.result for trade in losing_trades)  # Уже отрицательные
        net_pnl = total_profit + total_loss
        
        win_rate = (len(winning_trades) / len(completed_trades)) * 100 if completed_trades else Decimal("0")
        
        largest_win = max((trade.result for trade in winning_trades), default=Decimal("0"))
        largest_loss = min((trade.result for trade in losing_trades), default=Decimal("0"))
        
        average_win = total_profit / len(winning_trades) if winning_trades else Decimal("0")
        average_loss = total_loss / len(losing_trades) if losing_trades else Decimal("0")
        
        return {
            "total_trades": len(trades_data),
            "completed_trades": len(completed_trades),
            "winning_trades": len(winning_trades),
            "losing_trades": len(losing_trades),
            "win_rate": Decimal(str(round(win_rate, 2))),
            "total_profit": total_profit,
            "total_loss": total_loss,
            "net_pnl": net_pnl,
            "largest_win": largest_win,
            "largest_loss": largest_loss,
            "average_win": average_win,
            "average_loss": average_loss
        } 