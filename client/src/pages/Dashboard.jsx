import React, { useEffect, useState } from "react";
import axios from "axios";


import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  ShieldCheck,
  Play,
  Square,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

import PriceChart from "../components/PriceChart";
import "../styles/dashboard.css";


const API_URL = "http://localhost:5000";

function Dashboard() {
  // =========================================================
  // DASHBOARD STATE
  // =========================================================

  const [dashboardData, setDashboardData] = useState({
    balance: 10000,
    currentPrice: null,
    totalTrades: 0,
    openTrades: 0,
    closedTrades: 0,
    cancelledTrades: 0,
    totalPnL: 0,
    winningTrades: 0,
    losingTrades: 0,
    winRate: 0,
    tradingMode: "DRY_RUN",
  });

  // =========================================================
  // RISK STATE
  // =========================================================

  const [riskData, setRiskData] = useState({
    riskPerTrade: 1,
    maxOpenTrades: 3,
    openTrades: 0,
    openTradePercentage: 0,
    dailyLoss: 0,
    dailyLossLimit: 100,
    dailyLossPercentage: 0,
    dailyPnL: 0,
    riskStatus: "HEALTHY",
  });

  // =========================================================
  // RECENT TRADES
  // =========================================================

  const [recentTrades, setRecentTrades] = useState([]);

  // =========================================================
  // BOT STATE
  // =========================================================

  const [botRunning, setBotRunning] = useState(false);
  const [botLoading, setBotLoading] = useState(false);

  // =========================================================
  // GENERAL LOADING
  // =========================================================

  const [loading, setLoading] = useState(true);

  // =========================================================
  // FETCH DASHBOARD
  // =========================================================

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/dashboard`
      );

      if (response.data?.success) {
        setDashboardData(response.data.data);
      }
    } catch (error) {
      console.error(
        "❌ Dashboard API error:",
        error.message
      );
    }
  };

  // =========================================================
  // FETCH RISK
  // =========================================================

  const fetchRiskData = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/risk/status`
      );

      if (response.data?.success) {
        setRiskData(response.data.data);
      }
    } catch (error) {
      console.error(
        "❌ Risk API error:",
        error.message
      );
    }
  };

  // =========================================================
  // FETCH RECENT TRADES
  // =========================================================

  const fetchRecentTrades = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/dashboard/recent-trades`,
        {
          params: {
            limit: 10,
          },
        }
      );

      if (response.data?.success) {
        setRecentTrades(response.data.data || []);
      }
    } catch (error) {
      console.error(
        "❌ Recent trades error:",
        error.message
      );
    }
  };

  // =========================================================
  // FETCH BOT STATUS
  // =========================================================

  const fetchBotStatus = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/bot/status`
      );

      if (response.data?.success) {
        setBotRunning(
          response.data.data?.running || false
        );
      }
    } catch (error) {
      console.error(
        "❌ Bot status error:",
        error.message
      );
    }
  };

  // =========================================================
  // FETCH ALL DATA
  // =========================================================

  const fetchAllData = async () => {
    setLoading(true);

    await Promise.all([
      fetchDashboardData(),
      fetchRiskData(),
      fetchRecentTrades(),
      fetchBotStatus(),
    ]);

    setLoading(false);
  };

  // =========================================================
  // INITIAL LOAD + AUTO REFRESH
  // =========================================================

  useEffect(() => {
    fetchAllData();

    const interval = setInterval(() => {
      fetchDashboardData();
      fetchRiskData();
      fetchRecentTrades();
      fetchBotStatus();
    }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // =========================================================
  // START BOT
  // =========================================================

  const handleStartBot = async () => {
    try {
      setBotLoading(true);

      const response = await axios.post(
        `${API_URL}/api/bot/start`
      );

      if (response.data?.success) {
        setBotRunning(true);
      }
    } catch (error) {
      console.error(
        "❌ Start bot error:",
        error.message
      );

      alert(
        error?.response?.data?.message ||
          "Failed to start bot"
      );
    } finally {
      setBotLoading(false);
    }
  };

  // =========================================================
  // STOP BOT
  // =========================================================

  const handleStopBot = async () => {
    try {
      setBotLoading(true);

      const response = await axios.post(
        `${API_URL}/api/bot/stop`
      );

      if (response.data?.success) {
        setBotRunning(false);
      }
    } catch (error) {
      console.error(
        "❌ Stop bot error:",
        error.message
      );

      alert(
        error?.response?.data?.message ||
          "Failed to stop bot"
      );
    } finally {
      setBotLoading(false);
    }
  };

  // =========================================================
  // FORMAT MONEY
  // =========================================================

  const formatMoney = (value) => {
    const number = Number(value || 0);

    return `$${number.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // =========================================================
  // FORMAT PRICE
  // =========================================================

  const formatPrice = (value) => {
    if (
      value === null ||
      value === undefined
    ) {
      return "--";
    }

    return `$${Number(value).toLocaleString(
      "en-US",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;
  };

  // =========================================================
  // FORMAT PNL
  // =========================================================

  const formatPnL = (value) => {
    const number = Number(value || 0);

    if (number >= 0) {
      return `+$${number.toFixed(2)}`;
    }

    return `-$${Math.abs(number).toFixed(2)}`;
  };

  // =========================================================
  // RISK VALUES
  // =========================================================

  const openTradePercentage = Math.min(
    Number(
      riskData.openTradePercentage || 0
    ),
    100
  );

  const dailyLossPercentage = Math.min(
    Number(
      riskData.dailyLossPercentage || 0
    ),
    100
  );

  const riskHealthy =
    riskData.riskStatus === "HEALTHY";

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="dashboard">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="topbar">

        <div>
          <h1>Trading Dashboard</h1>

          <p>
            Monitor your trading bot and
            portfolio performance
          </p>
        </div>

        <div className="header-actions">

          <div className="bot-status">

            <span
              className="status-dot"
              style={{
                background: botRunning
                  ? "#35d879"
                  : "#ef4444",

                boxShadow: botRunning
                  ? "0 0 10px rgba(53,216,121,0.7)"
                  : "0 0 10px rgba(239,68,68,0.7)",
              }}
            />

            {botRunning
              ? "Bot Running"
              : "Bot Stopped"}

          </div>

          <button
            className="icon-button"
            onClick={fetchAllData}
            title="Refresh"
          >
            <RefreshCw size={17} />
          </button>

        </div>

      </div>

      {/* =====================================================
          BOT CONTROL
      ===================================================== */}

      <div className="control-panel">

        <div className="bot-info">

          <div className="bot-icon">
            <Activity size={22} />
          </div>

          <div>
            <h2>Trading Bot</h2>

            <p>
              Automated trading engine
            </p>
          </div>

        </div>

        <div className="market-info">

          <span>
            BTC/USDT
          </span>

          <span className="mode-badge">
            {dashboardData.tradingMode ||
              "DRY_RUN"}
          </span>

        </div>

        <div className="bot-controls">

          {!botRunning ? (
            <button
              className="control-button start"
              onClick={handleStartBot}
              disabled={botLoading}
            >
              <Play size={15} />

              {botLoading
                ? "Starting..."
                : "Start Bot"}
            </button>
          ) : (
            <button
              className="control-button stop"
              onClick={handleStopBot}
              disabled={botLoading}
            >
              <Square size={15} />

              {botLoading
                ? "Stopping..."
                : "Stop Bot"}
            </button>
          )}

        </div>

      </div>

      {/* =====================================================
          STATS
      ===================================================== */}

      <div className="stats-grid">

        {/* BALANCE */}

        <div className="stat-card">

          <div className="stat-header">

            <span>
              Balance
            </span>

            <div className="stat-icon">
              <DollarSign size={18} />
            </div>

          </div>

          <h2>
            {formatMoney(
              dashboardData.balance
            )}
          </h2>

          <div className="stat-change">
            Trading Balance
          </div>

        </div>

        {/* PNL */}

        <div className="stat-card">

          <div className="stat-header">

            <span>
              Total PnL
            </span>

            <div className="stat-icon">

              {dashboardData.totalPnL >= 0 ? (
                <TrendingUp size={18} />
              ) : (
                <TrendingDown size={18} />
              )}

            </div>

          </div>

          <h2
            className={
              dashboardData.totalPnL >= 0
                ? "positive"
                : "negative"
            }
          >
            {formatPnL(
              dashboardData.totalPnL
            )}
          </h2>

          <div className="stat-change">
            Closed trades PnL
          </div>

        </div>

        {/* TOTAL TRADES */}

        <div className="stat-card">

          <div className="stat-header">

            <span>
              Total Trades
            </span>

            <div className="stat-icon">
              <Activity size={18} />
            </div>

          </div>

          <h2>
            {dashboardData.totalTrades}
          </h2>

          <div className="stat-change">
            {dashboardData.openTrades} Open
          </div>

        </div>

        {/* WIN RATE */}

        <div className="stat-card">

          <div className="stat-header">

            <span>
              Win Rate
            </span>

            <div className="stat-icon">
              <TrendingUp size={18} />
            </div>

          </div>

          <h2>
            {Number(
              dashboardData.winRate || 0
            ).toFixed(2)}
            %
          </h2>

          <div className="stat-change">
            {dashboardData.winningTrades} Wins
          </div>

        </div>

      </div>

      {/* =====================================================
          MAIN GRID
      ===================================================== */}

      <div className="main-grid">

        {/* ===================================================
            CHART
        =================================================== */}

        <div className="chart-card">

          <div className="card-header">

            <div>
              <h2>
                BTC/USDT
              </h2>

              <p>
                5m Market Chart
              </p>
            </div>

            <div className="price-display">

              <strong>
                {formatPrice(
                  dashboardData.currentPrice
                )}
              </strong>

              <span className="positive">
                Live Price
              </span>

            </div>

          </div>

          <div
            style={{
              marginTop: "20px",
            }}
          >
            <PriceChart />
          </div>

        </div>

        {/* ===================================================
            RISK
        =================================================== */}

        <div className="risk-card">

          <div className="card-header">

            <div>
              <h2>
                Risk Management
              </h2>

              <p>
                Live trading risk
              </p>
            </div>

            <ShieldCheck
              size={21}
            />

          </div>

          {/* RISK PER TRADE */}

          <div className="risk-item">

            <div>
              <span>
                Risk Per Trade
              </span>

              <strong>
                {riskData.riskPerTrade}%
              </strong>
            </div>

          </div>

          {/* OPEN TRADES */}

          <div className="risk-item">

            <div>
              <span>
                Open Trades
              </span>

              <strong>
                {riskData.openTrades} /{" "}
                {riskData.maxOpenTrades}
              </strong>
            </div>

            <div className="progress">

              <span
                style={{
                  width: `${openTradePercentage}%`,
                }}
              />

            </div>

          </div>

          {/* DAILY LOSS */}

          <div className="risk-item">

            <div>
              <span>
                Daily Loss
              </span>

              <strong>
                {formatMoney(
                  Math.abs(
                    riskData.dailyLoss
                  )
                )}
                {" / "}
                {formatMoney(
                  riskData.dailyLossLimit
                )}
              </strong>
            </div>

            <div className="progress">

              <span
                style={{
                  width: `${dailyLossPercentage}%`,
                }}
              />

            </div>

          </div>

          {/* DAILY PNL */}

          <div className="risk-item">

            <div>
              <span>
                Daily PnL
              </span>

              <strong
                className={
                  riskData.dailyPnL >= 0
                    ? "positive"
                    : "negative"
                }
              >
                {formatPnL(
                  riskData.dailyPnL
                )}
              </strong>
            </div>

          </div>

          {/* RISK STATUS */}

          <div
            className={
              riskHealthy
                ? "risk-safe"
                : "risk-danger"
            }
          >

            <span>●</span>

            {riskHealthy
              ? "Risk limits are healthy"
              : "Risk limit reached"}

          </div>

        </div>

      </div>

      {/* =====================================================
          RECENT TRADES
      ===================================================== */}

      <div className="trades-card">

        <div className="card-header">

          <div>
            <h2>
              Recent Trades
            </h2>

            <p>
              Latest trading activity
            </p>
          </div>

          <button
            className="view-all"
            onClick={fetchRecentTrades}
          >
            Refresh
          </button>

        </div>

        <div className="table-wrapper">

          <table>

            <thead>

              <tr>
                <th>Symbol</th>
                <th>Side</th>
                <th>Strategy</th>
                <th>Entry</th>
                <th>Quantity</th>
                <th>PnL</th>
                <th>Status</th>
              </tr>

            </thead>

            <tbody>

              {recentTrades.length > 0 ? (
                recentTrades.map(
                  (trade, index) => {

                    const isBuy =
                      trade.side === "BUY";

                    return (
                      <tr
                        key={
                          trade._id ||
                          index
                        }
                      >

                        <td>
                          <strong>
                            {trade.symbol}
                          </strong>
                        </td>

                        <td>

                          <span
                            className={
                              isBuy
                                ? "side-buy"
                                : "side-sell"
                            }
                          >

                            {isBuy ? (
                              <ArrowUpRight
                                size={14}
                              />
                            ) : (
                              <ArrowDownRight
                                size={14}
                              />
                            )}

                            {trade.side}

                          </span>

                        </td>

                        <td>
                          {trade.strategy ||
                            "MANUAL"}
                        </td>

                        <td>
                          {formatPrice(
                            trade.entryPrice
                          )}
                        </td>

                        <td>
                          {Number(
                            trade.quantity ||
                              0
                          ).toFixed(6)}
                        </td>

                        <td
                          className={
                            Number(
                              trade.pnl || 0
                            ) >= 0
                              ? "positive"
                              : "negative"
                          }
                        >
                          {formatPnL(
                            trade.pnl
                          )}
                        </td>

                        <td>

                          <span
                            className={
                              trade.status ===
                              "OPEN"
                                ? "status-open"
                                : "status-closed"
                            }
                          >
                            {trade.status}
                          </span>

                        </td>

                      </tr>
                    );
                  }
                )
              ) : (
                <tr>

                  <td
                    colSpan="7"
                    style={{
                      textAlign: "center",
                      padding: "35px",
                      color: "#697386",
                    }}
                  >
                    No trades available
                  </td>

                </tr>
              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}

export default Dashboard; 