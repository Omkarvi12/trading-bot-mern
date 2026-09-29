import React, { useState } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowDownRight,
  ArrowUpRight,
  Play,
} from "lucide-react";

import { runBacktest } from "../services/api";
import "../styles/backtest.css";

const Backtest = () => {
  const [loading, setLoading] = useState(false);

  const [result, setResult] = useState({
    symbol: "BTC/USDT",
    timeframe: "5m",
    strategy: "EMA_CROSSOVER",
    candlesUsed: 500,
    initialBalance: 10000,
    finalBalance: 9991.09,
    totalPnL: -8.91,
    maxDrawdown: 14.97,

    performance: {
      totalTrades: 13,
      winningTrades: 3,
      losingTrades: 10,
      winRate: 23.08,
      totalProfit: 7.54,
      totalLoss: 16.44,
      totalPnL: -8.9,
      profitFactor: 0.46,
      returnPercent: -0.09,
      maxDrawdown: 0.15,
    },

    trades: [],
  });

  // ==========================================
  // RUN BACKTEST
  // ==========================================

  const handleRunBacktest = async () => {
    try {
      setLoading(true);

      const response = await runBacktest({
        symbol: "BTC/USDT",
        timeframe: "5m",
        strategy: "EMA_CROSSOVER",
        initialBalance: 10000,
        tradeSizePercent: 10,
        limit: 500,
      });

      if (response?.success && response?.data) {
        setResult(response.data);
      }
    } catch (error) {
      console.error("Backtest error:", error);

      alert(error?.response?.data?.message || "Failed to run backtest");
    } finally {
      setLoading(false);
    }
  };

  const performance = result?.performance || {};

  // ==========================================
  // FORMATTERS
  // ==========================================

  const formatMoney = (value) => {
    const number = Number(value || 0);

    return `$${number.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatPnL = (value) => {
    const number = Number(value || 0);

    if (number >= 0) {
      return `+$${number.toFixed(2)}`;
    }

    return `-$${Math.abs(number).toFixed(2)}`;
  };

  const formatPrice = (value) => {
    return `$${Number(value || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatQuantity = (value) => {
    return Number(value || 0).toFixed(8);
  };

  const getCloseReason = (trade) => {
    return trade?.closeReason || "OPPOSITE_SIGNAL";
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="bt-page">
      {/* ======================================
          HEADER
      ====================================== */}

      <div className="bt-header">
        <div className="bt-title-area">
          <h1>Backtest</h1>

          <p>
            {result.strategy || "EMA_CROSSOVER"} Strategy
            <span> • </span>
            {result.symbol || "BTC/USDT"}
            <span> • </span>
            {result.timeframe || "5m"}
          </p>
        </div>

        <button
          className="bt-run-button"
          onClick={handleRunBacktest}
          disabled={loading}
        >
          <Play size={16} />

          {loading ? "Running..." : "Run Backtest"}
        </button>
      </div>

      {/* ======================================
          STAT CARDS
      ====================================== */}

      <div className="bt-stat-grid">
        {/* INITIAL BALANCE */}

        <div className="bt-stat-card">
          <div className="bt-card-top">
            <span>Initial Balance</span>

            <div className="bt-icon">
              <DollarSign size={20} />
            </div>
          </div>

          <h2>{formatMoney(result.initialBalance)}</h2>
        </div>

        {/* FINAL BALANCE */}

        <div className="bt-stat-card">
          <div className="bt-card-top">
            <span>Final Balance</span>

            <div className="bt-icon">
              <DollarSign size={20} />
            </div>
          </div>

          <h2>{formatMoney(result.finalBalance)}</h2>
        </div>

        {/* PNL */}

        <div className="bt-stat-card">
          <div className="bt-card-top">
            <span>Backtest PnL</span>

            <div className="bt-icon">
              {Number(result.totalPnL) >= 0 ? (
                <TrendingUp size={20} />
              ) : (
                <TrendingDown size={20} />
              )}
            </div>
          </div>

          <h2
            className={Number(result.totalPnL) >= 0 ? "bt-profit" : "bt-loss"}
          >
            {formatPnL(result.totalPnL)}
          </h2>
        </div>

        {/* WIN RATE */}

        <div className="bt-stat-card">
          <div className="bt-card-top">
            <span>Win Rate</span>

            <div className="bt-icon">
              <TrendingUp size={20} />
            </div>
          </div>

          <h2>{Number(performance.winRate || 0).toFixed(2)}%</h2>

          <span className="bt-trade-count">
            {performance.totalTrades || 0} Trades
          </span>
        </div>
      </div>

      {/* ======================================
          PERFORMANCE
      ====================================== */}

      <div className="bt-performance">
        <div className="bt-performance-item">
          <span>Profit Factor</span>

          <strong>{Number(performance.profitFactor || 0).toFixed(2)}</strong>
        </div>

        <div className="bt-performance-item">
          <span>Max Drawdown</span>

          <strong>{formatMoney(result.maxDrawdown)}</strong>
        </div>

        <div className="bt-performance-item">
          <span>Return</span>

          <strong
            className={
              Number(performance.returnPercent || 0) >= 0
                ? "bt-profit"
                : "bt-loss"
            }
          >
            {Number(performance.returnPercent || 0).toFixed(2)}%
          </strong>
        </div>

        <div className="bt-performance-item">
          <span>Candles</span>

          <strong>{result.candlesUsed || 0}</strong>
        </div>
      </div>

      {/* ======================================
          TRADES
      ====================================== */}

      <div className="bt-trades-section">
        <div className="bt-table-wrapper">
          <table className="bt-table">
            <thead>
              <tr>
                <th>SIDE</th>
                <th>ENTRY</th>
                <th>EXIT</th>
                <th>QUANTITY</th>
                <th>PNL</th>
                <th>CLOSE REASON</th>
              </tr>
            </thead>

            <tbody>
              {result.trades && result.trades.length > 0 ? (
                result.trades.map((trade, index) => {
                  const isBuy = trade.side === "BUY";

                  const pnl = Number(trade.pnl || 0);

                  return (
                    <tr key={index}>
                      {/* SIDE */}

                      <td>
                        <div
                          className={
                            isBuy ? "bt-side bt-buy" : "bt-side bt-sell"
                          }
                        >
                          {isBuy ? (
                            <ArrowUpRight size={17} />
                          ) : (
                            <ArrowDownRight size={17} />
                          )}

                          <span>{trade.side}</span>
                        </div>
                      </td>

                      {/* ENTRY */}

                      <td>{formatPrice(trade.entryPrice)}</td>

                      {/* EXIT */}

                      <td>{formatPrice(trade.exitPrice)}</td>

                      {/* QUANTITY */}

                      <td>{formatQuantity(trade.quantity)}</td>

                      {/* PNL */}

                      <td>
                        <span
                          className={
                            pnl >= 0 ? "bt-trade-profit" : "bt-trade-loss"
                          }
                        >
                          {formatPnL(pnl)}
                        </span>
                      </td>

                      {/* CLOSE REASON */}

                      <td>
                        <span className="bt-close-reason">
                          {getCloseReason(trade)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="bt-no-trades">
                    No backtest trades available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Backtest;
