const express = require("express");
const router = express.Router();

const Trade = require("../models/Trade");

// ==========================================
// RISK CONFIGURATION
// ==========================================

const RISK_PER_TRADE = 1;
const MAX_OPEN_TRADES = 3;
const DAILY_LOSS_LIMIT = 100;

// ==========================================
// GET RISK STATUS
// GET /api/risk/status
// ==========================================

router.get("/status", async (req, res) => {
  try {
    // ========================================
    // OPEN TRADES
    // ========================================

    const openTrades = await Trade.countDocuments({
      status: "OPEN",
    });

    // ========================================
    // TODAY START
    // ========================================

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    // ========================================
    // TODAY'S CLOSED TRADES
    // ========================================

    const todayTrades = await Trade.find({
      status: "CLOSED",
      closedAt: {
        $gte: today,
      },
    }).select("pnl");

    // ========================================
    // DAILY PNL
    // ========================================

    const dailyPnL = todayTrades.reduce(
      (total, trade) => {
        return total + Number(trade.pnl || 0);
      },
      0
    );

    // Loss should be positive value for risk calculation
    const dailyLoss =
      dailyPnL < 0 ? Math.abs(dailyPnL) : 0;

    // ========================================
    // PERCENTAGES
    // ========================================

    const openTradePercentage = Math.min(
      (openTrades / MAX_OPEN_TRADES) * 100,
      100
    );

    const dailyLossPercentage = Math.min(
      (dailyLoss / DAILY_LOSS_LIMIT) * 100,
      100
    );

    // ========================================
    // RISK STATUS
    // ========================================

    let riskStatus = "HEALTHY";

    if (openTrades >= MAX_OPEN_TRADES) {
      riskStatus = "LIMIT_REACHED";
    }

    if (dailyLoss >= DAILY_LOSS_LIMIT) {
      riskStatus = "LIMIT_REACHED";
    }

    // ========================================
    // RESPONSE
    // ========================================

    res.json({
      success: true,

      data: {
        riskPerTrade: RISK_PER_TRADE,

        maxOpenTrades: MAX_OPEN_TRADES,

        openTrades,

        openTradePercentage,

        dailyLoss,

        dailyLossLimit: DAILY_LOSS_LIMIT,

        dailyLossPercentage,

        dailyPnL,

        riskStatus,
      },
    });
  } catch (error) {
    console.error(
      "❌ Risk API error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Unable to fetch risk information",
      error: error.message,
    });
  }
});

module.exports = router;